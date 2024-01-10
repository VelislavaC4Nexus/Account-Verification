function saveAccountToCO (email, password, phone, firstName, lastName) {
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
        url: URLUtils.https('Account-Verify', 'accountId', userData.custom.accountId)
    };

    var emailObj = {
        to: userData.custom.email,
        subject: Resource.msg('email.subject.verify.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountVerificationEmail', userObject);
}

function createAccountAfterVerification(){

}

module.exports = {
    saveAccountToCO: saveAccountToCO,
    sendVerificationEmail:sendVerificationEmail
};