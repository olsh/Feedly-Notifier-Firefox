# SDK Widgets on toolbars
This Jetpack module extends the `sdk/widget` module with one extra property, `toolbarID`, allowing Firefox Add-on developers to place widgets on toolbars.

## Usage
The API is identical to [`sdk/widget`](https://addons.mozilla.org/en-US/developers/docs/sdk/1.14/modules/sdk/widget.html) (only new properties were added).

Here's an example, based on the first example from the [`sdk/widget` documentation](https://addons.mozilla.org/en-US/developers/docs/sdk/1.14/modules/sdk/widget.html#Creation%20and%20Content). The created widget is not placed on the addon bar, but on the navigation bar.

```javascript
require("toolbarwidget").ToolbarWidget({
    toolbarID: "nav-bar", // <-- Place widget on Navigation bar
    id: "mozilla-icon",
    label: "My Mozilla Widget",
    contentURL: "http://www.mozilla.org/favicon.ico"
});
```

`ToolbarWidget` creates a `sdk/widget` instance, moves it to the desired toolbar, and returns the `Widget` instance.  
This instance has a read-only property called `toolbarID`. If you want to move the widget, destroy it and create it again.

The standard Widget does not support setting the height of a widget. This module does support this feature,
because there's no point in placing a tiny button on a toolbar. You can choose a preferred height by setting the `height` property.
The widget's height cannot be bigger than the container's height.

## Installation
You can add the module globally (in the `packages` directory under the SDK root), to make it available to all of your Jetpack projects,
or add it to a single project (in the `packages` directory under your add-on's root).

The official documentation contains a [tutorial on installing third-party modules](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/tutorials/adding-menus.html),
which suggests to download and extract an archive.  
I strongly recommend to use git for this purpose, because it makes package management *a lot easier*. For example:

```sh
# Go to the packages directory of the SDK's root.
cd /opt/addon-sdk/packages
# Clone the repository (creates a directory "toolbarwidget-jplib")
git clone git://github.com/Rob--W/toolbarwidget-jplib.git
# Done! You may want to update and view the documentation...
addon-sdk && cfx sdocs
# Later, when you want to update the package to the latest version...
cd /opt/addon-sdk/packages/toolbarwidget-jplib
git pull
```

After installing the module, declare the dependency in [package.json](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/dev-guide/package-spec.html):

```js
    ...
    "dependencies": ["toolbarwidget"],
    ...
```

## Dependencies
The following standard Jetpack modules were used:

- [`sdk/windows/utils`](https://addons.mozilla.org/en-US/developers/docs/sdk/1.14/modules/sdk/window/utils.html)
- [`sdk/widget`](https://addons.mozilla.org/en-US/developers/docs/sdk/1.14/modules/sdk/widget.html)

## Related
- [`browser-action`](https://github.com/Rob--W/browser-action-jplib) - Jetpack module which brings Google Chrome's `chrome.browserAction` API to Firefox.

## Credits
Created by Rob Wu <gwnRob@gmail.com>.  
Inspired by Erik Void's [toolbarbutton](https://github.com/voldsoftware/toolbarbutton-jplib), a module which allows one to easily create simple toolbar buttons.

Released under a MIT license.
