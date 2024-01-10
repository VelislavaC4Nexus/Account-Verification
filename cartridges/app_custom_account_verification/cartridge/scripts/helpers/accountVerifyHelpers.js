function saveAccountToCO(email, password, phone, firstName, lastName) {
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");

    var accountId = UUIDUtils.createUUID();

    var accountObject;

    Transaction.wrap(function () {
        accountObject = CustomObjectMgr.createCustomObject("ACCOUNT_VERIFY_CO", accountId);
        accountObject.custom.email = email;
        accountObject.custom.password = password;
        accountObject.custom.phone = phone;
        accountObject.custom.firstName = firstName;
        accountObject.custom.lastName = lastName;
    });

    return accountObject;
}


/**
 * Send an email that would notify the user that account was created
 * @param {obj} userData - object that contains user's email address and name information.
 */
function sendVerificationEmail(userData) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');

    var userObject = {
        email: userData.custom.email,
        firstName: userData.custom.firstName,
        lastName: userData.custom.lastName,
        url: URLUtils.https('Account-Verify', 'accountId', userData.custom.accountId,'email', userData.custom.email)
    };

    var emailObj = {
        to: userData.custom.email,
        subject: Resource.msg('email.subject.verify.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountVerificationEmail', userObject);
}

function createAccountAfterVerification(accountCustomObject,accountId) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var URLUtils = require("dw/web/URLUtils");
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    // var accountCustomObject = CustomObjectMgr.getCustomObject(accountVerifyCO, accountId);
    // attempt to create a new user and log that user in.
    // if (accountCustomObject) {
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

    //     res.redirect(URLUtils.url('Account-Show',));
    // } else {
    //     accountCustomObject = 'expired'
    //     res.redirect(URLUtils.url('Login-Show', 'accountCustomObject', accountCustomObject));
    // }
}

module.exports = {
    saveAccountToCO: saveAccountToCO,
    sendVerificationEmail: sendVerificationEmail,
    createAccountAfterVerification:createAccountAfterVerification
};