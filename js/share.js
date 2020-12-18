(function(exports){
/*
    exports.test = function(){
         return 'This is a function from shared module';
    };
  */

    exports.getEmoteFromConfidenceLevel = function(confidenceLevel)
    {
        switch(confidenceLevel)
        {
            case 2 : return "fa-grin-stars";
            case 1 : return "fa-smile-beam";
            case 0 : return "fa-smile";
            case -1 : return "fa-meh";
            case -2 : return "fa-grimace";
            case -3 : return "fa-flushed";
        }
    };

  }(typeof exports === 'undefined' ? this.share = {} : exports));