var RMEGo = RMEGo || {};
RMEGo.Form = RMEGo.Form || {};

/** 
 * Represents a AutoSaver module to gather the input data from the given DOM object and recover back.
 * @constructor
 * @param {string} ID - A ID which is indicated a form tag and contains form controls.
 */
RMEGo.Form.AutoSaver = function(ID) {
    var self = this;
    self.dataset = [];
    self.procedure = {};
    self.DOM = document.getElementById(ID);
    self.FieldElements = [];
    self.settings = {
        "debug": true, // whether is in a debug mode.
        "timeout": 1000, // saving timeout.
        "keyname": "formdata", // localstorage key.
        "ignore": {
            "name": [""],
            "type": ["password", "submit", "button", "image"] // file would be always skipped even if it is not set in this array.
        }, // filter.
        "donot_savingempty": true,
    };

    var timeout = {};
    self.savingTimeout = function() {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            self.procedure.prepare_save(self);
            self.procedure.save(self);
            self.procedure.after_save(self);
        }, self.settings.timeout);
    };
    self.events();
    self.procedure.initial();
};

/**
 * Return a debug status, if in debug mode, it returns true.
 */
RMEGo.Form.AutoSaver.prototype.isDebug = function() {
    return this.prototype.config.debug;
};

/**
 * Collect the input data from form.
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
            case "file":
                break;
            case "radio":
            case "checkbox":
                var name = element.name;
                if (!indexes[name]) {
                    var index = [];
                    var list = self.DOM.querySelectorAll("*[name='" + name + "']");
                    list.forEach(function(element, i) { if (element.checked) index.push(i) });
                    indexes[name] = { name: name, type: element.type, indexes: index };
                }
                break;
            default:
                self.dataset.push({ "name": element.name, "type": element.type, "value": element.value });
                break;
        }
    });
    for (var key in indexes) {
        this.dataset.push(indexes[key]);
    }
    if (this.settings.donot_savingempty) {
        var i = this.dataset.length || 0;
        while (i--) {
            if (this.dataset[i].value == "") this.dataset.splice(i, 1);
            if (this.dataset[i].indexes && this.dataset[i].indexes.length == 0) this.dataset.splice(i, 1);
        }
    }
    return this;
};

/**
 * Binding events with custom functions.
 * @param {object} option - this object contains some optional function so that you could custom the procedures.
 */
RMEGo.Form.AutoSaver.prototype.events = function(option) {
    this.procedure = option || {};
    this.procedure.initial = this.procedure.initial || function(self) {
        //Default processing when the object is constructed.
    };
    this.procedure.prepare_save = this.procedure.prepare_save || function(self) {
        // Default preparing processing
    };
    this.procedure.save = this.procedure.save || function(self) {
        // Default saving processing
        window.localStorage[self.settings.keyname] = JSON.stringify(self.dataset);
    };
    this.procedure.after_save = this.procedure.after_save || function(self) {
        // Default finished processing
    };
    this.procedure.prepare_recover = this.procedure.prepare_recover || function(self) {
        // Default process before recovering
    }
    this.procedure.recover = this.procedure.recover || function(self) {
        // Default recovering process
        var datasource = window.localStorage[self.settings.keyname];
        var dataset = [];
        if (datasource) {
            try {
                dataset = JSON.parse(datasource);
            } catch (exc) {
                window.localStorage.removeItem(self.settins.keyname);
            }
        }
        if (dataset && dataset.length > 0) {
            dataset.forEach(function(element) {
                switch (element.type) {
                    case "file":
                        break;
                    case "radio":
                    case "checkbox":
                        var controls = self.DOM.querySelectorAll("[name='" + element.name + "']");
                        controls.forEach(function(ctrl) { ctrl.checked = false; })
                        element.indexes.forEach(function(index) {
                            controls[index].checked = true;
                        });
                        break;
                    default:
                        self.DOM.querySelector("[name='" + element.name + "']").value = element.value;
                        break;
                }
            });
        }
    }
    this.procedure.after_recover = this.procedure.after_recover || function() {
        // Default process after recovered.
    }
    var timeout = this.settings.timeout;
    var that = this;
    return this;
}

/**
 * Start runing the AutoSaver.
 */
RMEGo.Form.AutoSaver.prototype.run = function() {
    var that = this;
    self.collect();
    this.FieldElements.forEach(function(element) {
        element.addEventListener("change", that.savingTimeout);
        element.addEventListener("input", that.savingTimeout);
        element.addEventListener("propertychange", that.savingTimeout);
    });
    return this;
}

/**
 * Stop runing the AutoSaver.
 */
RMEGo.Form.AutoSaver.prototype.die = function() {
    var that = this;
    clearTimeout(that.savingTimeout);
    this.FieldElements.forEach(function(element) {
        element.removeEventListener("change", that.savingTimeout);
        element.removeEventListener("input", that.savingTimeout);
        element.removeEventListener("propertychange", that.savingTimeout);
    });
    return this;
}

/**
 * Processing recover procedure.
 */
RMEGo.Form.AutoSaver.prototype.recover = function() {
    this.procedure.prepare_recover(this);
    this.procedure.recover(this);
    this.procedure.after_recover(this);
    return this;
}

/**
 * Extend string.isIn(array) to check if the string is in the array.
 */
String.prototype.isIn = function(array) {
    var self = this.toString();
    for (var i in array) {
        if (array[i].toString() == self)
            return true;
    };
    return false;
};