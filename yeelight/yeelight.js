module.exports = function(RED) {
    "use strict";
    var Yeelight = require("yeelight2")

    function YeelightConnection(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        if(this.credentials &&
            this.credentials.hostname && this.credentials.portnum){


            setTimeout(
             (function(self) {
                 return function() {
                        self.setupConnection.apply(self, arguments);
                    }
             })(this), 1000
            );
        }

        this.on('close', function() {
            this.light.exit();
        });
        this.mainNode = RED.nodes.getNode(n.yeelight);

        this.setupConnection = function(){
            this.light = Yeelight(node.credentials.hostname,node.credentials.portnum);
            this.light.on('connect',function(){
                console.log("connected to lamp")
            })
            this.light.on('error',function(err){
                console.log("Yeelight error",err)
                node.light = null;

                // try to reconnect
                setTimeout(
                 (function(self) {
                     return function() {
                            node.setupConnection.apply(self, arguments);
                        }
                 })(this), 1000*2
                );
            })
        }

    }

    RED.nodes.registerType("yeelight-config",YeelightConnection,{
        credentials: {
            hostname: { type:"text" },
            portnum: { type:"text" }
        }
    });



    function YeelightNode(n) {
        RED.nodes.createNode(this,n);
        this.config = RED.nodes.getNode(n.config);
        this.command = n.command

        var node = this;

        node.status({});

        var msg = {};
        this.send(msg);
        
        this.on('input', function (msg) {
            try {
                var cmd = this.command
                this.light = this.config ? this.config.light : null;
                if (this.light != null) {
                    this.light[cmd](msg.payload)
                    node.status({fill:"green",shape:"ring",text:"Connected"});
                }else{
                    console.log("light not connected, trying to reconnect")
                    this.config.setupConnection();
                }      
            } catch(err) {
                node.status({fill:"red",shape:"ring",text:err});
                this.error(err)
                console.log(err)
                console.log("error when sending cmd, trying to reconnect")
                this.config.setupConnection();
            }
        });
        this.on("close", function() {

        });
    }

    RED.nodes.registerType("yeelight",YeelightNode);

}
