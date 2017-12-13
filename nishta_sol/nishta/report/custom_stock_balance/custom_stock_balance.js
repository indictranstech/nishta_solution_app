// Copyright (c) 2016, indictrans and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Custom Stock Balance"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"width": "80",
			"reqd": 1,
			"default": frappe.sys_defaults.year_start_date,
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"width": "80",
			"reqd": 1,
			"default": frappe.datetime.get_today()
		},
		{
			"fieldname": "item_group",
			"label": __("Item Group"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Item Group"
		},
		{
			"fieldname": "item_code",
			"label": __("Item"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Item"
		},
		{
			"fieldname": "warehouse",
			"label": __("Warehouse"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Warehouse"
		},
	],
	onload: (report) => {
		frappe.call({
				method: "nishta_sol.nishta.report.custom_stock_balance.custom_stock_balance.get_user_warehouse",
				callback: function(r) {
					if(r.message) {
						$("[data-fieldname=warehouse]").val(r.message[0][0]);
					}
				}
			});
	},

}


