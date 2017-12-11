/* global Clusterize */

frappe.provide('erpnext.pos');

frappe.pages['point-of-sale'].on_page_load = function(wrapper) {
	
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Point of Sale',
		single_column: true
	});

	frappe.db.get_value('POS Settings', {name: 'POS Settings'}, 'is_online', (r) => {
		if (r && r.use_pos_in_offline_mode && !cint(r.use_pos_in_offline_mode)) {
			// online
			wrapper.pos = new erpnext.pos.PointOfSale(wrapper);
			window.cur_pos = wrapper.pos;
		} else {
			// offline
			frappe.set_route('pos');
		}
	});
};

frappe.pages['point-of-sale'].refresh = function(wrapper) {
	if (wrapper.pos) {
		cur_frm = wrapper.pos.frm;
	}
}

erpnext.pos.PointOfSale = class PointOfSale {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find('.layout-main-section');
		this.page = wrapper.page;

		const assets = [
			'assets/erpnext/js/pos/clusterize.js',
			'assets/erpnext/css/pos.css'
		];

		frappe.require(assets, () => {
			this.make();
		});
	}

	make() {
		return frappe.run_serially([
			() => {
				this.prepare_dom();
				this.prepare_menu();
				this.set_online_status();
			},
			() => this.setup_company(),
			() => this.setup_pos_profile(),
			() => this.make_new_invoice(),
			() => {
				frappe.timeout(1);
				this.make_items();
				this.bind_events();
			},
			() => this.page.set_title(__('Point of Sale'))
		]);
	}

	set_online_status() {
		this.connection_status = false;
		this.page.set_indicator(__("Offline"), "grey");
		frappe.call({
			method: "frappe.handler.ping",
			callback: r => {
				if (r.message) {
					this.connection_status = true;
					this.page.set_indicator(__("Online"), "green");
				}
			}
		});
	}

	prepare_dom() {
		this.wrapper.append(`
			<div class="pos">
				<section class="cart-container">

				</section>
				<section class="item-container">

				</section>
			</div>
		`);
	}

	make_cart() {
		this.cart = new POSCart({
			frm: this.frm,
			wrapper: this.wrapper.find('.cart-container'),
			pos_profile: this.pos_profile,
			events: {
				on_customer_change: (customer) => this.frm.set_value('customer', customer),
				on_field_change: (item_code, field, value) => {
					this.update_item_in_cart(item_code, field, value);
				},
				on_numpad: (value) => {
					if (value == 'Pay') {
						if (!this.payment) {
							this.make_payment_modal();
						} else {
							this.frm.doc.payments.map(p => {
								this.payment.dialog.set_value(p.mode_of_payment, p.amount);
							});

							this.payment.set_title();
						}
						this.payment.open_modal();
					}
				},
				on_select_change: () => {
					this.cart.numpad.set_inactive();
				},
				get_item_details: (item_code) => {
					return this.items.get(item_code);
				}
			}
		});
	}

	toggle_editing(flag) {
		let disabled;
		if (flag !== undefined) {
			disabled = !flag;
		} else {
			disabled = this.frm.doc.docstatus == 1 ? true: false;
		}
		const pointer_events = disabled ? 'none' : 'inherit';

		this.wrapper.find('input, button, select').prop("disabled", disabled);
		this.wrapper.find('.number-pad-container').toggleClass("hide", disabled);

		this.wrapper.find('.cart-container').css('pointer-events', pointer_events);
		this.wrapper.find('.item-container').css('pointer-events', pointer_events);

		this.page.clear_actions();
	}

	make_items() {
		this.items = new POSItems({
			wrapper: this.wrapper.find('.item-container'),
			pos_profile: this.pos_profile,
			events: {
				update_cart: (item, field, value) => {
					if(!this.frm.doc.customer) {
						frappe.throw(__('Please select a customer'));
					}
					this.update_item_in_cart(item, field, value);
					this.cart && this.cart.unselect_all();
				}
			}
		});
	}

	update_item_in_cart(item_code, field='qty', value=1) {
		if(this.cart.exists(item_code)) {
			const item = this.frm.doc.items.find(i => i.item_code === item_code);
			frappe.flags.hide_serial_batch_dialog = false;

			if (typeof value === 'string' && !in_list(['serial_no', 'batch_no'], field)) {
				// value can be of type '+1' or '-1'
				value = item[field] + flt(value);
			}

			if(field === 'serial_no') {
				value = item.serial_no + '\n'+ value;
			}

			if(field === 'qty' && (item.serial_no || item.batch_no)) {
				this.select_batch_and_serial_no(item);
			} else {
				this.update_item_in_frm(item, field, value)
					.then(() => {
						// update cart
						this.update_cart_data(item);
					});
			}
			return;
		}

		let args = { item_code: item_code };
		if (in_list(['serial_no', 'batch_no'], field)) {
			args[field] = value;
		}

		// add to cur_frm
		const item = this.frm.add_child('items', args);
		frappe.flags.hide_serial_batch_dialog = true;
		this.frm.script_manager
			.trigger('item_code', item.doctype, item.name)
			.then(() => {
				const show_dialog = item.has_serial_no || item.has_batch_no;
				if (show_dialog && field == 'qty') {
					// check has serial no/batch no and update cart
					this.select_batch_and_serial_no(item);
				} else {
					// update cart
					this.update_cart_data(item);
				}
			});
	}

	select_batch_and_serial_no(item) {
		erpnext.show_serial_batch_selector(this.frm, item, () => {
			this.update_item_in_frm(item)
				.then(() => {
					// update cart
					if (item.qty === 0) {
						frappe.model.clear_doc(item.doctype, item.name);
					}
					this.update_cart_data(item);
				});
		}, true);
	}

	update_cart_data(item) {
		this.cart.add_item(item);
		this.cart.update_taxes_and_totals();
		this.cart.update_grand_total();
	}

	update_item_in_frm(item, field, value) {
		if (field == 'qty' && value < 0) {
			frappe.msgprint(__("Quantity must be positive"));
			value = item.qty;
		}

		if (field) {
			return frappe.model.set_value(item.doctype, item.name, field, value)
				.then(() => this.frm.script_manager.trigger('qty', item.doctype, item.name))
				.then(() => {
					console.log(item.qty, item.amount);

					if (field === 'qty' && item.qty === 0) {
						frappe.model.clear_doc(item.doctype, item.name);
					}
				})
		}

		return Promise.resolve();
	}

	make_payment_modal() {
		this.payment = new Payment({
			frm: this.frm,
			events: {
				submit_form: () => {
					
					// Code by Radhika ===== On submit directly print the pos order ======
					frappe.call({
						method: 'erpnext.selling.page.point_of_sale.point_of_sale.submit_invoice',
						freeze: true,
						args: {
							doc: this.frm.doc
						}
					}).then(r => {	
						if(r.message) {
							this.frm.doc = r.message;
							frappe.show_alert({
								indicator: 'green',
								message: __(`Sales invoice ${r.message.name} created succesfully`)
							});

							this.toggle_editing();
							// this.set_form_action();
							this.make_new_invoice();
							if(this.frm.doc.docstatus == 1){

								if (this.pos_profile && this.pos_profile.print_format_for_online) {
									this.frm.meta.default_print_format = this.pos_profile.print_format_for_online;
								}
								this.frm.print_preview.printit(true);

							}

						}
					});

				}
			}
		});
	}

	submit_sales_invoice() {

		frappe.confirm(__("Permanently Submit {0}?", [this.frm.doc.name]), () => {
			frappe.call({
				method: 'erpnext.selling.page.point_of_sale.point_of_sale.submit_invoice',
				freeze: true,
				args: {
					doc: this.frm.doc
				}
			}).then(r => {
				if(r.message) {
					this.frm.doc = r.message;
					frappe.show_alert({
						indicator: 'green',
						message: __(`Sales invoice ${r.message.name} created succesfully`)
					});

					this.toggle_editing();
					this.set_form_action();
				}
			});
		});
	}

	bind_events() {

	}

	setup_pos_profile() {
		return new Promise(resolve => {
			frappe.call({
				method: 'erpnext.stock.get_item_details.get_pos_profile',
				args: {
					company: this.company
				}
			}).then(r => {
				this.pos_profile = r.message;

				if (!this.pos_profile) {
					this.pos_profile = {
						company: this.company,
						currency: frappe.defaults.get_default('currency'),
						selling_price_list: frappe.defaults.get_default('selling_price_list')
					};
				}
				resolve();
			});
		})
	}

	setup_company() {
		this.company = frappe.sys_defaults.company;
		return new Promise(resolve => {
			if(!this.company) {
				frappe.prompt({fieldname:"company", options: "Company", fieldtype:"Link",
					label: __("Select Company"), reqd: 1}, (data) => {
						this.company = data.company;
						resolve(this.company);
				}, __("Select Company"));
			} else {
				resolve(this.company);
			}
		})
	}

	make_new_invoice() {
		return frappe.run_serially([
			() => this.make_sales_invoice_frm(),
			() => {
				if (this.cart) {
					this.cart.frm = this.frm;
					this.cart.reset();
				} else {
					this.make_cart();
				}
				this.toggle_editing(true);
			}
		]);
	}

	make_sales_invoice_frm() {
		const doctype = 'Sales Invoice';
		return new Promise(resolve => {
			if (this.frm) {
				this.frm = get_frm(this.pos_profile, this.frm);
				resolve();
			} else {
				frappe.model.with_doctype(doctype, () => {
					this.frm = get_frm(this.pos_profile);
					resolve();
				});
			}
		});

		function get_frm(pos_profile, _frm) {
			const page = $('<div>');
			const frm = _frm || new _f.Frm(doctype, page, false);
			const name = frappe.model.make_new_doc_and_get_name(doctype, true);
			frm.refresh(name);
			frm.doc.items = [];
			if(!frm.doc.company) {
				frm.set_value('company', pos_profile.company);
			}
			frm.set_value('is_pos', 1);
			frm.meta.default_print_format = 'POS Invoice';
			return frm;
		}
	}

	prepare_menu() {
		var me = this;
		this.page.clear_menu();

		// for mobile
		// this.page.add_menu_item(__("Pay"), function () {
		//
		// }).addClass('visible-xs');

		this.page.add_menu_item(__("Form View"), function () {
			frappe.model.sync(me.frm.doc);
			frappe.set_route("Form", me.frm.doc.doctype, me.frm.doc.name);
		});

		this.page.add_menu_item(__("POS Profile"), function () {
			frappe.set_route('List', 'POS Profile');
		});

		this.page.add_menu_item(__('POS Settings'), function() {
			frappe.set_route('Form', 'POS Settings');
		});
	}

	set_form_action() {
		if(this.frm.doc.docstatus !== 1) return;

		this.page.set_secondary_action(__("Print"), () => {
			if (this.pos_profile && this.pos_profile.print_format_for_online) {
				this.frm.meta.default_print_format = this.pos_profile.print_format_for_online;
			}
			this.frm.print_preview.printit(true);
		});

		this.page.set_primary_action(__("New"), () => {
			this.make_new_invoice();
		});

		this.page.add_menu_item(__("Email"), () => {
			this.frm.email_doc();
		});
	}
};

