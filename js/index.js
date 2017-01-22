navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

var recalibrate = 1;
var pxbase = [];

var PhotoBooth = {
  onMediaStream: function (stream) {

    PhotoBooth.canvas = $('#picturizer')[0];
    PhotoBooth.context= PhotoBooth.canvas.getContext('2d');
    PhotoBooth.cBase = $('#baseline')[0];
    PhotoBooth.cCxt =  PhotoBooth.cBase.getContext('2d');

    PhotoBooth.localVideo = $('video')[0];
    PhotoBooth.localVideo.src = window.URL.createObjectURL(stream);
    
    window.setInterval(function(){
          //Recalibrate the background every other frame
          if( recalibrate == 0 ){
            recalibrate = 1;
            GetBase();
            //
          }else{
            recalibrate--;
            GetPicture();
          }
          
        },100);
    GetBase();

  },
  noStream: function() {
    console.log('oh no!');
    alert('GetUserMedia not available. Make sure you are using an ssl connection. For local testing use Firefox. Or maybe your webcam isn\'t plugged in.');
  },
  getPixels: function() {
    return this.context.getImageData(0,0,this.canvas.width,this.canvas.height);
  },
  filterImage: function(filter) {
    // var args = [this.getPixels(image)];
    // for (var i=2; i<arguments.length; i++) {
    //     args.push(arguments[i]);
    // }
    // return filter.apply(null, args);

    var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    imageData = filter(imageData);
    this.context.putImageData(imageData, 0, 0);
  },
  diffImage: function(filter) {
    var baseData = this.cCxt.getImageData(0, 0, this.canvas.width, this.canvas.height);
    var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    imageData = filter(imageData,baseData);
    this.context.putImageData(imageData, 0, 0);
  },
  grayscale: function (pixels, args) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = (r+g+b)/3;
    }
    return pixels;
  }
};

function GetBase(){
        PhotoBooth.cCxt.drawImage(PhotoBooth.localVideo, 0, 0, 1024, 1024);

        var tmppx = PhotoBooth.cCxt.getImageData(0, 0, PhotoBooth.canvas.width, PhotoBooth.canvas.height);
        var d = tmppx.data;

        for (var i = 0; i < d.length; i += 4) {
            var r = d[i];
            var g = d[i + 1];
            var b = d[i + 2];
            if( pxbase[(i/4)] > 0 ){
            //if( false ){
                pxbase[(i/4)] = Math.floor((pxbase[(i/4)]+((r+g+b)/3))/2);
            }else{
                pxbase[(i/4)] = Math.floor((r+g+b)/3);
            }
            
        }
        //console.log($scope.pxbase);
        
    }

function GetPicture(){
  PhotoBooth.context.drawImage(PhotoBooth.localVideo, 0, 0, 1024, 1024);
  
  PhotoBooth.context.drawImage(PhotoBooth.localVideo, 0, 0, 1024, 1024);

            PhotoBooth.diffImage(function (pixels, base) {
                var db = base.data;
                var d = pixels.data;

                var factor = (259 * (100 + 255)) / (255 * (259 - 100));

                //for (var i = 0; i < d.length; i += 4) {
                for (var i = 0; i < Math.sqrt(d.length*4); i += 4) {
                    console.log('sqrt', Math.sqrt(d.length*4))
                //for (var i = 0; i < 2; i += 4) {
                    var diffidx = 0;
                    var offidx = 0;
                    for (var j = 0; j < Math.sqrt(d.length*4); j += 4) {
                        
                        var idx = (i*1024)+j;

                        //console.log(idx);

                        // var rb = db[idx];
                        // var gb = db[idx + 1];
                        // var bb = db[idx + 2];
                        // db[idx] = db[idx + 1] = db[idx + 2] = (rb+gb+bb)/3;

                        var r = d[idx];
                        var g = d[idx + 1];
                        var b = d[idx + 2];
                        d[idx] = d[idx + 1] = d[idx + 2] = Math.floor((r+g+b)/3);

                        if( d[idx] > pxbase[(idx/4)]-5 && d[idx] < pxbase[(idx/4)]+5 ){
                            db[idx] = db[idx + 1] = db[idx + 2] = 255;
                        }else{
                            db[idx] = db[idx + 1] = db[idx + 2] = 0;
                        }


                        // Colorizize
                        if( db[idx] == 255 ){
                        //if( d[i] != db[i] ){
                            //d[i] = d[i + 1] = d[i + 2] = 0;
                            d[idx] = 0;
                            d[idx+1] = 0;
                            d[idx+2] = 255;
                            
                        }else if( db[idx-(10*4)] == 255 || db[idx+(10*4)] == 255 ){
                        //if( d[i] != db[i] ){
                            //d[i] = d[i + 1] = d[i + 2] = 0;
                            //d[idx] *= .5;
                            if( d[idx] > (255/2) ){
                               d[idx+2] = 255;
                                d[idx+1] = 255-(255*(1-((d[idx+1]-(255/2))/(255/2))));
                            }else{
                                 d[idx+2] = 255-(255*(((d[idx+2]/(255/2)))));
                                d[idx+1] = 255;
                            }
                            d[idx] = 0;
                        }else{
                            //d[i] = d[i + 1] = d[i + 2] = 255;
                            if( d[idx] > (255/2) ){
                                d[idx] = 255;
                                d[idx+1] = 255*(1-((d[idx+1]-(255/2))/(255/2)));
                            }else{
                                d[idx] = 255*(((d[idx]/(255/2))));
                                d[idx+1] = 255;
                            }
                            d[idx + 2] = 0;
                        }

                    }

                }

                return pixels;
            });
}

$('#btn-start').click(function(){
  //alert('test');
  navigator.getUserMedia(
    {video: true},
    PhotoBooth.onMediaStream,
    PhotoBooth.noStream
  );
  $(this).hide();
  return false;
});