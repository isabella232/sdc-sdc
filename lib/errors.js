/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

/*
 * Error classes for some of the sdc tools.
 */

var util = require('util'),
    format = util.format;
var assert = require('assert-plus');
var verror = require('verror'),
    WError = verror.WError;



// ---- error classes

/**
 * Base imgadm error. Instances will always have a string `message` and
 * a string `code` (a CamelCase string).
 */
function SdcError(options) {
    assert.object(options, 'options');
    assert.string(options.message, 'options.message');
    assert.string(options.code, 'options.code');
    assert.optionalObject(options.cause, 'options.cause');
    assert.optionalNumber(options.statusCode, 'options.statusCode');
    var self = this;

    var args = [];
    if (options.cause) args.push(options.cause);
    args.push(options.message);
    WError.apply(this, args);

    var extra = Object.keys(options).filter(
        function (k) { return ['cause', 'message'].indexOf(k) === -1; });
    extra.forEach(function (k) {
        self[k] = options[k];
    });
}
util.inherits(SdcError, WError);

function InternalError(options) {
    assert.object(options, 'options');
    assert.optionalString(options.source, 'options.source');
    assert.optionalObject(options.cause, 'options.cause');
    assert.string(options.message, 'options.message');
    var message = options.message;
    if (options.source) {
        message = options.source + ': ' + message;
    }
    SdcError.call(this, {
        cause: options.cause,
        message: message,
        code: 'InternalError',
        exitStatus: 1
    });
}
util.inherits(InternalError, SdcError);

function UsageError(cause, message) {
    if (message === undefined) {
        message = cause;
        cause = undefined;
    }
    assert.string(message);
    SdcError.call(this, {
        cause: cause,
        message: message,
        code: 'Usage',
        exitStatus: 1
    });
}
util.inherits(UsageError, SdcError);

function NoSuchKeyError(cause, loginOrUuid, keyNameOrFingerprint) {
    if (keyNameOrFingerprint === undefined) {
        keyNameOrFingerprint = loginOrUuid;
        loginOrUuid = cause;
        cause = undefined;
    }
    assert.string(loginOrUuid, 'loginOrUuid');
    assert.string(keyNameOrFingerprint, 'keyNameOrFingerprint');
    SdcError.call(this, {
        cause: cause,
        message: format('user "%s" has no key with name or fingerprint "%s"',
            loginOrUuid, keyNameOrFingerprint),
        code: 'NoSuchKey',
        exitStatus: 1
    });
}
util.inherits(NoSuchKeyError, SdcError);

function NoSuchAttributeError(cause, loginOrUuid, attr) {
    if (attr === undefined) {
        attr = loginOrUuid;
        loginOrUuid = cause;
        cause = undefined;
    }
    assert.string(loginOrUuid, 'loginOrUuid');
    assert.string(attr, 'attr');
    SdcError.call(this, {
        cause: cause,
        message: format('user "%s" has no attribute "%s"',
            loginOrUuid, attr),
        code: 'NoSuchAttribute',
        exitStatus: 1
    });
}
util.inherits(NoSuchAttributeError, SdcError);

function NoSuchValueError(cause, loginOrUuid, attr, value) {
    if (value === undefined) {
        value = attr;
        attr = loginOrUuid;
        loginOrUuid = cause;
        cause = undefined;
    }
    assert.string(loginOrUuid, 'loginOrUuid');
    assert.string(attr, 'attr');
    assert.string(value, 'value');
    SdcError.call(this, {
        cause: cause,
        message: format('user "%s" attribute "%s" has no value "%s"',
            loginOrUuid, attr, value),
        code: 'NoSuchValue',
        exitStatus: 1
    });
}
util.inherits(NoSuchValueError, SdcError);

function APIError(cause) {
    assert.object(cause, 'cause');
    assert.optionalNumber(cause.statusCode, 'cause.statusCode');
    assert.string(cause.body.code, 'cause.body.code');
    assert.string(cause.body.message, 'cause.body.message');
    var message = cause.body.message;
    if (cause.body.errors) {
        cause.body.errors.forEach(function (e) {
            message += format('\n    %s: %s', e.field, e.code);
            if (e.message) {
                message += ': ' + e.message;
            }
        });
    }
    SdcError.call(this, {
        cause: cause,
        message: message,
        code: cause.body.code,
        statusCode: cause.statusCode,
        exitStatus: 1
    });
}
APIError.description = 'An error from an SDC API request.';
util.inherits(APIError, SdcError);




// ---- exports

module.exports = {
    SdcError: SdcError,
    InternalError: InternalError,
    UsageError: UsageError,
    NoSuchKeyError: NoSuchKeyError,
    NoSuchAttributeError: NoSuchAttributeError,
    NoSuchValueError: NoSuchValueError,
    APIError: APIError
};
