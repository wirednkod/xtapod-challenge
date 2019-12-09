# starter_repo
Starter repo for getting to know how the Osmosis codebase works

1. Run `./configure`.
2. Run `node osmosis.js`.
3. Navigate to `localhost:3005`.

# Notes

A basic documentation of the Osmosis framework

## Table of Contents

  1. [Components](#1)  
      1.1 [Base Component](#1.1)  
      1.2 [Mixing a Component](#1.2)
  1. [Binding](#2)  
      2.1 [In a `prototype`](#2.1)

<a name="1"></a><a name="Components"></a>
## Components

  <a name="1.1"></a><a name="Components-Base-Component"></a>
  - ### Base Component

    ```javascript
    /**
     * Component() is a component to be rendered onto the screen.
     * It is comprised of a `.js`, `.jade`, and `.less` file.
     * 
     * @param {function} bind 
     * @param {Object} args Arguments passed in when the component is mixed
     */
    function Component(bind,args) {
      bind(this);
    }

    Component.prototype.exampleFunction = function() {}

    module.exports = Component;
    ```

  <a name="1.2"></a><a name="Components-Mixing-a-Component"></a>
  - ### Mixing a Component

    ParentComponent.js
    ```javascript
    function ParentComponent(bind, args) {
      // You must call `bind(this)` before mixing
      bind(this)

      fs.mix(this, 'ui/ChildComponent');
    }

    module.exports = ParentComponent;
    ```

    ParentComponent.jade
    ```jade
    .ui-ParentComponent
      .ui-ChildComponent
    ```

    ChildComponent.js
    ```javascript
    function ChildComponent(bind, args) {
      bind(this)
    }

    module.exports = ChildComponent;
    ```

<a name="2"></a><a name="Binding"></a>
## Binding inside foreach

  <a name="2.1"></a><a name="Binding-In-a-prototype"></a>
  - ### In a `prototype`

    Example.js

    ```js
    Component.prototype.exampleFunction = function(item) {
      var self = this;

      return function() {
        // Use `self` in place of `this` to access component variables
        // `item` references the individual list item itself
      }
    }
    ```

    Example.jade

    ```jade
    .ui-Component
      div(data-bind="foreach: items")
        div(data-bind="click: exampleFunction($data)")
    ```
