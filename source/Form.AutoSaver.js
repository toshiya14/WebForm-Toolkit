var RMEGo = RMEGo || {};
RMEGo.Form = RMEGo.Form || {};

/**
 * Represents a AutoSaver module to gather the input data from the given DOM object and recover back.
 * 
 * @constructor
 * @param {string} ID - A ID which is indicated a form tag and contains form controls.
 */
RMEGo.Form.AutoSaver = function(ID) {
    var self = this;
    self.savingTimeout = {};
    self.dataset = {};
    self.DOM = document.getElementById(ID);
    self.FieldElements = [];
    self.settings = {
        "debug": true, // whether is in a debug mode.
        "timeout": 1000, // saving timeout.
        "keyname": "formdata", // localstorage key.
        "ignore": {
            "name": [""],
            "type": ["password", "submit", "button", "image"]
        }, // filter.
    };
    self.eventBinding();
};

/**
 * Return a debug status, if in debug mode, it returns true.
 */
RMEGo.Form.AutoSaver.prototype.isDebug = function() {
    return this.prototype.config.debug;
};

/**
 * Collect the input data from form.
 * 
 */
RMEGo.Form.AutoSaver.prototype.collect = function() {
    var self = this;
    var indexes = {};
    this.dataset = [];
    this.FieldElements = [];
    this.FieldElements = this.FieldElements.concat(Array.prototype.slice.call(this.DOM.getElementsByTagName("input")));
    this.FieldElements = this.FieldElements.concat(Array.prototype.slice.call(this.DOM.getElementsByTagName("textarea")));
    this.FieldElements = this.FieldElements.concat(Array.prototype.slice.call(this.DOM.getElementsByTagName("select")));
    this.FieldElements.forEach(function(element) {
        if (element.name.isIn(self.settings.ignore.name) || element.type.isIn(self.settings.ignore.type)) return;
        switch (element.type) {
            default: self.dataset.push({ "name": element.name, "type": element.type, "value": element.value });
            break;

            case "radio":
                    case "checkbox":
                    var name = element.name;
                if (!indexes[name]) {
                    var index = [];
                    var list = self.DOM.querySelectorAll("*[name=" + name + "]");
                    list.forEach(function(element, i) { if (element.checked) index.push(i) });
                    indexes[name] = { name: name, type: element.type, indexes: index };
                }
                break;
        }
    });
    for (var key in indexes) {
        this.dataset.push(indexes[key]);
    }
    return JSON.stringify(this.dataset);
};

/**
 * Binding event with custom functions.
 * 
 * @param {object} option - this object contains 3 optional function.
 *     `prepare` is used for the processing before the data saving.
 *     `saving` is used for the processing during the data saving.
 *     `finished` is used for the processing after the data saving.
 */
RMEGo.Form.AutoSaver.prototype.eventBinding = function(option) {
    var procedure = option || {};
    procedure.prepare = procedure.prepare || RMEGo.Form.AutoSaver.DefaultPrepareProcedure;
    procedure.saving = procedure.saving || RMEGo.Form.AutoSaver.DefaultSavingProcedure;
    procedure.finished = procedure.finished || RMEGo.Form.AutoSaver.DefaultFinishedProcedure;
    var timeout = this.settings.timeout;
    var that = this;
    this.FieldElements.forEach(function(element) {
        var eventHandler = function() {
            clearTimeout(that.savingTimeout);
            that.savingTimeout = setTimeout(function() {
                procedure.prepare(that);
                procedure.saving(that);
                procedure.finished(that);
            }, timeout);
        }
        element.addEventListener("change", eventHandler);
        element.addEventListener("input", eventHandler);
        element.addEventListener("propertychange", eventHandler);
    })
}

RMEGo.Form.AutoSaver.DefaultPrepareProcedure = function(self) {

};

RMEGo.Form.AutoSaver.DefaultSavingProcedure = function(self) {
    self.collect();
    window.localStorage[self.settings.keyname] = JSON.stringify(self.dataset);
};

RMEGo.Form.AutoSaver.DefaultFinishedProcedure = function(self) {
    console.log(self.dataset);
};

String.prototype.isIn = function(array) {
    var self = this.toString();
    for (var i in array) {
        if (array[i].toString() == self)
            return true;
    };
    return false;
};