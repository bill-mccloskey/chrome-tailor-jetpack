/**
 * Prebound with the `config` settings in the build script `./scripts/build-chrome-api-child.js`,
 * this function is then called with additional arguments, exposed to the user as a chrome API:
 * `tabs.duplicate(tab)`
 * Handles the message communication with the main Jetpack proc.
 */
let INC_ID = 0;

JETPACK.RPC = function (config) {
  var id = INC_ID++;
  var args = Array.prototype.slice.call(arguments);
  // Pop off the configuration;
  args.shift();
  var successCallback = config.success != null ? args[config.success] : null;
  // Not really supporting failureCallback at the moment, as only one API uses it.
  var failureCallback = config.failure != null ? args[config.failure] : null;

  self.port.on("chrome-api:response", handler);
  self.port.emit("chrome-api:request", {
    method: config.method,
    args: args,
    id: id,
    name: config.name,
    success: config.success,
    failure: config.failure
  });

  function handler (data) {
    if (data.id !== id) {
      return;
    }
    self.port.removeListener("chrome-api:response", handler);
    var callback = data.error ? failureCallback : successCallback;
    if (typeof callback === "function") {
      if (data.res != null) {
        callback.apply(null, cleanse(data.res));
      } else {
        callback();
      }
    }
  }
};

function cleanse (obj) {
  return unsafeWindow.JSON.parse(JSON.stringify(obj));
}
