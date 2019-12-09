fusion
======

Short for diffusion: the more general form of Osmosis

fusion contains the basic components of the framework that Osmosis uses so that it can easily be reused across other repositories.

## Installing fusion
First, make sure your project has a package.json file:
```
npm init
```

In order for fusion to work, you need to install the following modules in your project before installing fusion. Fusion does not replicate these modules in its own `node_modules` so it expects them in the root project (`--save` will save them to your package.json so your `node_modules` directory can be safely ignored):

```
npm install fibers --save
npm install express --save
npm install jade --save
npm install dateformat --save
```
