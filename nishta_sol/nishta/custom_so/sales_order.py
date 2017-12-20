from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt, add_months, cint, nowdate, getdate
from frappe.model.document import Document
from erpnext.accounts.doctype.purchase_invoice.purchase_invoice import get_fixed_asset_account
from frappe.model.mapper import get_mapped_doc

def make_sales_invoice(doc,method=None):
	source_name = doc.name
	target_doc = None
	si_exist = frappe.db.get_value("Sales Invoice Item", {"sales_order": doc.name}, "parent")
	if si_exist:
		si_exist = frappe.get_doc("Sales Invoice", si_exist)
		si_exist.advance_paid = doc.advance_paid
		si_exist.save()
	else:
		doclist = get_mapped_doc("Sales Order", source_name,{
			"Sales Order": {
			"doctype": "Sales Invoice",
				"field_map": {
					"advance_paid":"advance_paid"
				}
			},
			"Sales Order Item": {
				"doctype": "Sales Invoice Item",
				"field_map": {
					"name": "so_detail",
					"parent": "sales_order",
				},
			},
		}, target_doc)
		doclist.save()
		return doclist

def update_sales_invoice(doc,method=None):
	if not doc.is_new():
		make_sales_invoice(doc)