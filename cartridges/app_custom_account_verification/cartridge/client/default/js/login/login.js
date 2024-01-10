'use strict';

var base = require('base/login/login')

var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');

base.register = function () {
    $('form.registration').submit(function (e) {
        console.log('register-cusrtom');
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.registration').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                console.log('1');
                form.spinner().stop();
                if (!data.success) {
                    $('form.registration').trigger('login:register:error', data);
                    formValidation(form, data);
                } else {
                    console.log('login-success2');
                    $('form.registration').trigger('login:register:success', data);
                    form.trigger('reset');
                    $('.verify-registration').removeClass('d-none');
                    $('#login-tab').addClass('active');
                    $('#login').addClass('active');
                    $('#register-tab').removeClass('active');
                    $('#register').removeClass('active');
                    $('.verify-link-expired').addClass('d-none');
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
                }

                form.spinner().stop();
            }
        });
        return false;
    });
}

module.exports = base




