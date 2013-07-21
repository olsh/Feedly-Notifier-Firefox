/*globals require, exports*/
'use strict';

const toolbarwidget = require('toolbarwidget');
const windowUtils = require('sdk/window/utils');
const ASYNC_TEST_TIMEOUT = 5000;

function $(id) windowUtils.getMostRecentBrowserWindow().document.getElementById(id)

exports['test widget on toolbar'] = function(assert, done) {
    let finished = false;

    let toolbarID = 'nav-bar';
    let widgetID = 'mozilla-icon';
    let toolbarWidget;
    var options = {
        toolbarID: toolbarID,
        id: widgetID,
        label: 'My Mozilla Widget',
        contentURL: 'http://www.mozilla.org/favicon.ico',
        onAttach: function() {
            let toolbar = $(toolbarID);
            assert.ok(!!toolbar, 'toolbar exists for toolbarID "' + toolbarID + '"');

            let widget = $(toolbarwidget.getWidgetId(widgetID));
            assert.ok(!!widget, 'widget element found');
            assert.ok(toolbar.contains(widget), 'Toolbar contains widget');
            finished = true;
            toolbarWidget.destroy();
            done();
        }
    };
    toolbarWidget = toolbarwidget.ToolbarWidget(options);

    // Stop the test when it takes too long...
    require('sdk/timers').setTimeout(function() {
        if (!finished) {
            throw new Error('Test takes too long. onAttach was not called within ' + ASYNC_TEST_TIMEOUT + 'ms.');
        }
    }, ASYNC_TEST_TIMEOUT);
};
exports['test widget on toolbar'] = function(assert, done) {
    let finished = false;

    let widgetID = 'small-badge';
    let toolbarWidget;
    var options = {
        id: widgetID,
        label: 'My Mozilla Widget',
        contentURL: 'http://www.mozilla.org/favicon.ico',
        height: 10,
        onAttach: function() {
            let widget = $(toolbarwidget.getWidgetId(widgetID));
            assert.ok(!!widget, 'widget element found');
            let iframe = widget.querySelector('iframe');
            assert.ok(!!iframe, 'iframe found within widget');

            assert.equal(iframe.style.height, '10px', 'Height of widget is changed');

            toolbarWidget.height = 20;
            assert.equal(iframe.style.height, '20px', 'Height of widget is changed again');

            finished = true;
            toolbarWidget.destroy();
            done();
        }
    };
    toolbarWidget = toolbarwidget.ToolbarWidget(options);

    // Stop the test when it takes too long...
    require('sdk/timers').setTimeout(function() {
        if (!finished) {
            throw new Error('Test takes too long. onAttach was not called within ' + ASYNC_TEST_TIMEOUT + 'ms.');
        }
    }, ASYNC_TEST_TIMEOUT);
};

require('sdk/test').run(exports);
