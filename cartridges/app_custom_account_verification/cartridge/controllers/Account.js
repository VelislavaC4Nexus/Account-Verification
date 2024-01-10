'use strict';

/**
 * @namespace Account
 */

var server = require('server');
server.extend(module.superModule);


var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var CustomerMgr = require('dw/customer/CustomerMgr');
var accountVerifyHelpers = require('*/cartridge/scripts/helpers/accountVerifyHelpers');
var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

/**
 * Account-SubmitRegistration : The Account-SubmitRegistration endpoint is the endpoint that gets hit when a shopper submits their registration for a new account
 * @name Base/Account-SubmitRegistration
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - rurl - redirect url. The value of this is a number. This number then gets mapped to an endpoint set up in oAuthRenentryRedirectEndpoints.js
 * @param {httpparameter} - dwfrm_profile_customer_firstname - Input field for the shoppers's first name
 * @param {httpparameter} - dwfrm_profile_customer_lastname - Input field for the shopper's last name
 * @param {httpparameter} - dwfrm_profile_customer_phone - Input field for the shopper's phone number
 * @param {httpparameter} - dwfrm_profile_customer_email - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_customer_emailconfirm - Input field for the shopper's email address
 * @param {httpparameter} - dwfrm_profile_login_password - Input field for the shopper's password
 * @param {httpparameter} - dwfrm_profile_login_passwordconfirm: - Input field for the shopper's password to confirm
 * @param {httpparameter} - dwfrm_profile_customer_addtoemaillist - Checkbox for whether or not a shopper wants to be added to the mailing list
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var registrationForm = server.forms.getForm('profile');

        // form validation
        if (registrationForm.customer.email.value.toLowerCase()
            !== registrationForm.customer.emailconfirm.value.toLowerCase()
        ) {
            registrationForm.customer.email.valid = false;
            registrationForm.customer.emailconfirm.valid = false;
            registrationForm.customer.emailconfirm.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
            registrationForm.valid = false;
        }

        if (registrationForm.login.password.value
            !== registrationForm.login.passwordconfirm.value
        ) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.mismatch.password', 'forms', null);
            registrationForm.valid = false;
        }

        if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
            registrationForm.valid = false;
        }

        // setting variables for the BeforeComplete function
        var registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            phone: registrationForm.customer.phone.value,
            email: registrationForm.customer.email.value,
            emailConfirm: registrationForm.customer.emailconfirm.value,
            password: registrationForm.login.password.value,
            passwordConfirm: registrationForm.login.passwordconfirm.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };

        if (registrationForm.valid) {
            res.setViewData(registrationFormObj);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                // var Transaction = require('dw/system/Transaction');
                // var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

                var authenticatedCustomer;
                var serverError;

                // getting variables for the BeforeComplete function
                var registrationForm = res.getViewData(); // eslint-disable-line

                if (registrationForm.validForm) {
                    var newAccount;
                    var login = registrationForm.email;
                    var password = registrationForm.password;

                    newAccount = accountVerifyHelpers.saveAccountToCO(registrationForm.email, registrationForm.password, registrationForm.phone, registrationForm.firstName, registrationForm.lastName);
                    // // attempt to create a new user and log that user in.
                    // try {
                    //     Transaction.wrap(function () {
                    //         var error = {};
                    //         //save account info in custom object
                    //         // var newCustomer = CustomerMgr.createCustomer(login, password);

                    //         // var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                    //         // if (authenticateCustomerResult.status !== 'AUTH_OK') {
                    //         //     error = { authError: true, status: authenticateCustomerResult.status };
                    //         //     throw error;
                    //         // }

                    //         // authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                    //         // if (!authenticatedCustomer) {
                    //         //     error = { authError: true, status: authenticateCustomerResult.status };
                    //         //     throw error;
                    //         // } else {
                    //         //     // assign values to the profile
                    //         //     var newCustomerProfile = newCustomer.getProfile();

                    //         //     newCustomerProfile.firstName = registrationForm.firstName;
                    //         //     newCustomerProfile.lastName = registrationForm.lastName;
                    //         //     newCustomerProfile.phoneHome = registrationForm.phone;
                    //         //     newCustomerProfile.email = registrationForm.email;
                    //         // }
                    //     });
                    // } catch (e) {
                    //     if (e.authError) {
                    //         serverError = true;
                    //     } else {
                    //         registrationForm.validForm = false;
                    //         registrationForm.form.customer.email.valid = false;
                    //         registrationForm.form.customer.emailconfirm.valid = false;
                    //         registrationForm.form.customer.email.error =
                    //             Resource.msg('error.message.username.invalid', 'forms', null);
                    //     }
                    // }
                }

                delete registrationForm.password;
                delete registrationForm.passwordConfirm;
                formErrors.removeFormValues(registrationForm.form);

                if (serverError) {
                    res.setStatusCode(500);
                    res.json({
                        success: false,
                        errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
                    });

                    return;
                }

                if (registrationForm.validForm) {
                    //send verification email
                    accountVerifyHelpers.sendVerificationEmail(newAccount);

                    // // send a registration email
                    // accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);

                    res.setViewData({ authenticatedCustomer: authenticatedCustomer });
                    res.json({
                        success: true,
                        redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
                    });

                    req.session.privacyCache.set('args', null);
                } else {
                    res.json({
                        fields: formErrors.getFormErrors(registrationForm)
                    });
                }
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(registrationForm)
            });
        }

        return next();
    }
);

server.get('Verify', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var URLUtils = require("dw/web/URLUtils");

    var accountId = req.querystring.accountId;
    var accountCustomObject = CustomObjectMgr.getCustomObject("ACCOUNT_VERIFY_CO", accountId);

    // attempt to create a new user and log that user in.
    if (accountCustomObject) {
        var login = accountCustomObject.custom.email;
        var password = accountCustomObject.custom.password;
        try {
            Transaction.wrap(function () {
                var error = {};
                // save account info in custom object
                var newCustomer = CustomerMgr.createCustomer(login, password);
                // var authenticatedCustomer;
                var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                if (authenticateCustomerResult.status !== 'AUTH_OK') {
                    error = { authError: true, status: authenticateCustomerResult.status };
                    throw error;
                }

                var authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);
                // send a registration email

                if (!authenticatedCustomer) {
                    error = { authError: true, status: authenticateCustomerResult.status };
                    throw error;
                } else {
                    // assign values to the profile
                    var newCustomerProfile = newCustomer.getProfile();

                    newCustomerProfile.firstName = accountCustomObject.custom.firstName;
                    newCustomerProfile.lastName = accountCustomObject.custom.lastName;
                    newCustomerProfile.phoneHome = accountCustomObject.custom.phone;
                    newCustomerProfile.email = accountCustomObject.custom.email;
                }
                accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);
                CustomObjectMgr.remove(accountCustomObject)
            });
        } catch (e) {
                serverError = true;
        }

        res.redirect(URLUtils.url('Account-Show',));
    } else {
        accountCustomObject='expired'
        res.redirect(URLUtils.url('Login-Show', 'accountCustomObject', accountCustomObject));
    }

    next();

})

module.exports = server.exports();
