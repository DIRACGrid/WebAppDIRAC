Ext.define("DIRAC.ProxyUpload.classes.ProxyUpload", {
  extend: "Ext.dirac.core.Module",

  requires: ["Ext.toolbar.Toolbar", "Ext.button.Button", "Ext.form.field.File", "Ext.form.field.Text", "Ext.panel.Panel", "Ext.form.Panel"],

  initComponent: function () {
    var me = this;

    me.launcher.title = "Proxy Upload";
    me.launcher.maximized = false;

    me.launcher.width = 400;
    me.launcher.height = 350;

    var oDimensions = GLOBAL.APP.MAIN_VIEW.getViewMainDimensions();

    me.launcher.x = oDimensions[0] / 2 - me.launcher.width / 2;
    me.launcher.y = oDimensions[1] / 2 - me.launcher.height / 2;

    Ext.apply(me, {
      layout: "border",
      bodyBorder: false,
      defaults: {
        collapsible: true,
        split: true,
      },
    });

    me.callParent(arguments);
  },

  buildUI: function () {
    var me = this;

    me.btnUpload = new Ext.Button({
      text: "Upload",
      margin: 1,
      iconCls: "dirac-icon-upload",
      handler: function () {
        me.__oprUploadFile();
      },
      scope: me,
    });

    me.btnReset = new Ext.Button({
      text: "Reset",
      margin: 1,
      iconCls: "dirac-icon-reset",
      handler: function () {
        me.uploadField.reset(); // fileInputEl.dom.value = "";
        me.passwordField.setValue("");
      },
      scope: me,
    });

    var oPanelButtons = new Ext.create("Ext.toolbar.Toolbar", {
      dock: "bottom",
      layout: {
        pack: "center",
      },
      items: [me.btnUpload, me.btnReset],
    });

    me.uploadField = new Ext.create("Ext.form.field.File", {
      fieldLabel: "Certificate",
      anchor: "100%",
      buttonText: "Browse",
      labelAlign: "left",
    });

    me.passwordField = new Ext.create("Ext.form.field.Text", {
      fieldLabel: "p12 Password",
      inputType: "password",
      anchor: "100%",
      labelAlign: "left",
      name: "pass_p12",
      enableKeyEvents: true,
      listeners: {
        keypress: function (oTextField, e, eOpts) {
          if (e.getCharCode() == 13) {
            me.__oprUploadFile();
          }
        },
      },
    });

    me.mainFormPanel = new Ext.create("Ext.form.Panel", {
      floatable: false,
      region: "center",
      layout: "anchor",
      header: false,
      bodyPadding: 5,
      autoScroll: true,
      dockedItems: [oPanelButtons],
      items: [
        {
          html:
            "<div style='padding:5px 5px 10px 5px;background-color:#FFFF94;margin-bottom:20px;'>" +
            "<h2>Important !</h2><div style='text-align:justify'>We are not keeping neither your private key nor password for p12 file on our service. While we try to make this " +
            "process as secure as possible by using " +
            "SSL to encrypt the p12 file with your credentials when it is sent to the server, " +
            "for maximum security, we recommend that you manually convert and upload the proxy using DIRAC client commands:</div>" +
            "<br/><b>dirac-cert-convert.sh YOUR_P12_FILE_NAME.p12</b>" +
            "<br/><b>dirac-proxy-init -U -g GROUP_NAME</b></div>",
          xtype: "box",
          anchor: "100%",
        },
        me.uploadField,
        me.passwordField,
      ],
    });

    me.add([me.mainFormPanel]);
  },

  __oprUploadFile: function () {
    var me = this;

    var sFileName = me.uploadField.getValue();
    var sPassword = me.passwordField.getValue();

    if (sFileName != "" && sPassword != "") {
      if (sFileName.substr(-4) != ".p12") {
        GLOBAL.APP.CF.alert("You have to choose the *.p12 file with you credentials", "warning");
        return;
      }

      me.getContainer().body.mask("Wait ...");

      me.mainFormPanel.submit({
        url: GLOBAL.BASE_URL + "ProxyUpload/proxyUpload",
        success: function (form, action) {
          me.getContainer().body.unmask();

          if (action.result.success == "false") {
            GLOBAL.APP.CF.alert(action.result.error, "error");
          } else {
            var resultText = action.result.result;
            resultText = resultText.replace(new RegExp("\n", "g"), "<br/>");
            GLOBAL.APP.CF.alert(resultText, "info");
          }

          me.passwordField.setValue("");
        },
        failure: function (form, action) {
          me.uploadField.reset();
          me.passwordField.setValue("");
          me.getContainer().body.unmask();
        },
      });
    } else {
      GLOBAL.APP.CF.alert("Both fields are mandatory !", "warning");
    }
  },
});
