// Copyright (c) 2016, indictrans and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Custom Sales Register"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			"width": "80"
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today()
		},
		{
			"fieldname":"customer",
			"label": __("Customer"),
			"fieldtype": "Link",
			"options": "Customer"
		},
		// {
		// 	"fieldname":"company",
		// 	"label": __("Company"),
		// 	"fieldtype": "Link",
		// 	"options": "Company",
		// 	"default": frappe.defaults.get_user_default("Company")
		// },
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"get_query": function () {
				args = frappe.session.user
				return {
					query:"nishta_sol.nishta.report.custom_sales_register.custom_sales_register.get_user"
				}

			}
		},



		{
			"fieldname":"mode_of_payment",
			"label": __("Mode of Payment"),
			"fieldtype": "Link",
			"options": "Mode of Payment"
		}
	],
	onload: (report) => {
		frappe.call({
				method: "nishta_sol.nishta.report.custom_sales_register.custom_sales_register.get_user_company",
				callback: function(r) {
					if(r.message) {
						$("[data-fieldname=company]").val(r.message[0][0]);
					}
				}
			});
	},

}
