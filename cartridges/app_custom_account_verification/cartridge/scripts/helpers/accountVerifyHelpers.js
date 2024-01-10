/**
 * Save account data into custom object
 * @param {obj} userData - object that contains user's email address and name information.
 */
function saveAccountToCO(userData) {
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var encoder = require('*/cartridge/scripts/utilHelpers/utilHelper');

    var encodedPassword = encoder.encode(userData.password)
    var accountId = UUIDUtils.createUUID();

    var accountObject;

    Transaction.wrap(function () {
        accountObject = CustomObjectMgr.createCustomObject("ACCOUNT_VERIFY_CO", accountId);
        accountObject.custom.email = userData.email;
        accountObject.custom.password = encodedPassword;
        accountObject.custom.phone = userData.phone;
        accountObject.custom.firstName = userData.firstName;
        accountObject.custom.lastName = userData.lastName;
    });

    return accountObject;
}

/**
 * Send an email to verify the account create
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
        url: URLUtils.https('Account-Verify', 'accountId', userData.custom.accountId, 'email', userData.custom.email)
    };

    var emailObj = {
        to: userData.custom.email,
        subject: Resource.msg('email.subject.verify.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountVerificationEmail', userObject);
}

/**
 * Create account after account verification
 * Send an email that account is created
 * @param {obj} accountCustomObject - object that contains user's email address and name information.
 * @param {string} accountId - account id from query params, id of the custom object that keeps customers data
 */
function createAccountAfterVerification(accountCustomObject, accountId) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var URLUtils = require("dw/web/URLUtils");
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var encoder = require('*/cartridge/scripts/utilHelpers/utilHelper');

    // attempt to create a new user and log that user in.
    var login = accountCustomObject.custom.email;
    var password =encoder.decode(accountCustomObject.custom.password);
    try {
        Transaction.wrap(function () {
            var error = {};
            // save account info in custom object
            var newCustomer = CustomerMgr.createCustomer(login, password);
            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                error = { authError: true, status: authenticateCustomerResult.status };
                throw error;
            }

            var authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

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
            // send a registration email
            accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);
            CustomObjectMgr.remove(accountCustomObject)
        });
    } catch (e) {
        serverError = true;
    }
}

module.exports = {
    saveAccountToCO: saveAccountToCO,
    sendVerificationEmail: sendVerificationEmail,
    createAccountAfterVerification: createAccountAfterVerification
};