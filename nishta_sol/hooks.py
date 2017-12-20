# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "nishta_sol"
app_title = "nishta"
app_publisher = "indictrans"
app_description = "nishta"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "radhika.g@indictranstech.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/nishta_sol/css/nishta_sol.css"
# app_include_js = "/assets/js/nishta_sol.min.js"

# include js, css files in header of web template
# web_include_css = "/assets/nishta_sol/css/nishta_sol.css"
# web_include_js = "/assets/nishta_sol/js/nishta_sol.js"

# include js in page
page_js = {"point-of-sale" : "public/js/point_of_sale.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "nishta_sol.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "nishta_sol.install.before_install"
# after_install = "nishta_sol.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "nishta_sol.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Sales Order": {
	"after_insert": "nishta_sol.nishta.custom_so.sales_order.make_sales_invoice",
		"validate": "nishta_sol.nishta.custom_so.sales_order.update_sales_invoice"
	}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"nishta_sol.tasks.all"
# 	],
# 	"daily": [
# 		"nishta_sol.tasks.daily"
# 	],
# 	"hourly": [
# 		"nishta_sol.tasks.hourly"
# 	],
# 	"weekly": [
# 		"nishta_sol.tasks.weekly"
# 	]
# 	"monthly": [
# 		"nishta_sol.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "nishta_sol.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "nishta_sol.event.get_events"
# }

fixtures = ["Custom Field","Property Setter","Report","Custom Script","Role"]

