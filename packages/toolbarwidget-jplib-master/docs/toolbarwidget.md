The `toolbarwidget` module enables you to create [widgets](modules/sdk/widget.html) and place it on any toolbar.

The API is identical to [`sdk/widget`](modules/sdk/widget.html), with the exception of the new properties listed below.
See the [`sdk/widget` documentation](modules/sdk/widget.html) for the full documentation.

## Example ##

    require("toolbarwidget").ToolbarWidget({
        toolbarID: "nav-bar", // Place widget on navigation bar
        height: 32,           // Change height. Default 16px, now at most 32px.
        id: "mozilla-icon",
        label: "My Mozilla Widget",
        contentURL: "http://www.mozilla.org/favicon.ico"
    });

<api name="ToolbarWidget">
@class

Represents a [Widget](modules/sdk/widgets.html).

<api name="ToolbarButton">
@constructor
Creates a new widget. The widget is immediately added to the specified toolbar.

@param options {object}
An object with [all keys from widget](modules/sdk/widget.html#Widget%29options%29) and the following key:

  @prop toolbarID {string}
    The id of the toolbar which you want to add the widget to.
    If invalid, it will be placed on the default addon bar.

    Example toolbar IDs:

    - **toolbar-menubar**: The menu bar.
    - **nav-bar**: The navigation bar.
    - **PersonalToolbar**: The bookmarks toolbar.
    - **TabsToolbar**: The tabs bar.
    - **addon-bar**: The addon bar.

  @prop forceMove {boolean}
    If true, the toolbar will be forced to stick at its position.

  @prop height {number}
    Optional height in pixels of the widget. If not given, a default height is used.
    If this value is greater than the height of the toolbar, then the widget's height
    is reduced to the toolbar's height.

</api>
<api name="toolbarID">
@property {string}
  The ID of the toolbar to which you've added the widget.  Read-only.
</api>
<api name="forceMove">
@property {boolean}
  If true, the toolbar will be forced to stick at its position.
</api>
<api name="height">
@property {string}
  The maximum height of the widget. Setting it updates the widget's appearance immediately.
</api>
<api name="minHeight">
@property {string}
  The current height of the widget (the smallest among the widgets with this ID).  Read-only
</api>
</api>
