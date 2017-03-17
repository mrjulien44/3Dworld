var THREE = require("plugins/3Dworld/lib/three.min.js");
var moment = require("moment");

var Globe = function () {

  var colorFn = function(x) {
    var c = new THREE.Color();
    switch (x) {
      case 1 :
        //c = new THREE.Color("rgb(250,170,0)");
        //c.setHSL(40,96.0,51);
        c.setHex(0xfaaa0a);
        break;
      case 2 :
        //c = new THREE.Color("rgb(240,125,0)");
        //c.setHSL(31,100.1,47.1);
        c.setHex(0xf07d00);
        break;
      case 3 :
        //c = new THREE.Color("rgb(225,75,15)");
        //c.setHSL(17,87.5,47.1);
        c.setHex(0xe14b0f);
        break;
      case 4 :
        //c = new THREE.Color("rgb(150,0,0)");
        //c.setHSL(0,100.0,29.4);
        c.setHex(0x960000);
        break;
      case 5 :
        //c = new THREE.Color("rgb(207,2,43)");
        //c.setHSL(348,98.1,41);
        c.setHex(0xcf022b);
        break;
    }
    //var c = new THREE.Color();
    //var c = new THREE.Color("hsl(348%, 98%, 41%)");
    //var toto=new THREE.Color.gethsl(207,2,43);
    //c.setHSL( ( 0.8 - ( x * 0.5 ) ), 1.0, 0.4 );
    //c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
    return c;
  };
  var Shaders = {
    'earth': {
      uniforms: {
        'texture': {type: 't', value: null}
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        'vNormal = normalize( normalMatrix * normal );',
        'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        'vec3 diffuse = texture2D( texture, vUv ).xyz;',
        'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
        'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
        'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere': {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
        'vNormal = normalize( normalMatrix * normal );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
        'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
        'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var config;
  var $timeout;
  var initialized;
  var PI_HALF = Math.PI / 2;
  var mouseSphere=[];
  var mouseSphereCoords = null;
  var scene, camera, renderer;
  var sphere, atmosphere, point, mesh, datapoints, subgeo;
  var targetList = [];
  var baseColor;
  var projector,INTERSECTED;
  var mouseOnDown = {x: 0, y: 0};
  var mouse = {x: 0, y: 0};
  var targetOnDown = {x: 0, y: 0};
  var target = {x: PI_HALF + 0.2, y: Math.PI / 6.0};
  var rotation = {x: 0, y: 0};
  var overRenderer;
  var legende=[];
  var textureLoader;
  var origins = {};

  var distance = 100000;
  var distanceTarget = 100000;

  var sphereRadius = 200;
  var MAX_POINTS = 100;

  var container;

  var idleTime = 0;

  function setConfig(c, t) {
    config = c;
    $timeout = t;
  }
  function clear() {
    // try{
    if (scene !== undefined) {
      scene.children.forEach(function(object){
          if(object.type === "Mesh")
              scene.remove(object);
       });
      //delete legende if they are already exists
      var leg = document.getElementById("legende");
      var B=leg.getElementsByTagName('tbody');
      while (leg.hasChildNodes()) {   
        leg.removeChild(leg.firstChild);
      }
      //delete logs if they are already exists
      var leg = document.getElementById("logs");
      var B=leg.getElementsByTagName('tbody');
      while (leg.hasChildNodes()) {   
        leg.removeChild(leg.firstChild);
      }
      initialized=true;
    } else {
      initialized=false;
    }
  }

  function init(c) {
    container = c[0];
    var w = container.offsetWidth || window.innerWidth;
    var h = container.offsetHeight || window.innerHeight;

  if (initialized==false) {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = 1000; //1000;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);
  }
    addSphere();
    
    var geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));
  
    point = new THREE.Mesh(geometry);

    /* Sphere controls */
    container.addEventListener('mousedown', onMouseDown, false);

    // Support for chrome and firefox
    container.addEventListener('mousewheel', onMouseWheel, false);
    container.addEventListener('DOMMouseScroll', onMouseWheel, false);

    container.addEventListener('mouseover', function () {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function () {
      overRenderer = false;
    }, false);

    container.addEventListener( 'mousemove', onDocumentMouseMove, false );
  }

  function addSphere() {
    // Add sphere
    var geometry = new THREE.SphereGeometry(sphereRadius, 40, 30);

    textureLoader = new THREE.TextureLoader();
    var uniforms = THREE.UniformsUtils.clone(Shaders['earth'].uniforms);
    //console.log(config.choixmap);
    var image='/plugins/3Dworld/'+config.choixmap;
    uniforms['texture'].value = textureLoader.load(image);
    //uniforms['texture'].value = THREE.ImageUtils.loadTexture('world.png');
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: Shaders['earth'].vertexShader,
      fragmentShader: Shaders['earth'].fragmentShader
    });

    sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.y = Math.PI;
    scene.add(sphere);

    // Add atmosphere
    uniforms = THREE.UniformsUtils.clone(Shaders['atmosphere'].uniforms);

    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: Shaders['atmosphere'].vertexShader,
      fragmentShader: Shaders['atmosphere'].fragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    atmosphere = new THREE.Mesh(geometry, material);
    atmosphere.scale.set(1.1, 1.1, 1.1);
    scene.add(atmosphere);

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(mesh);

    var newSphereGeom= new THREE.SphereGeometry(5,5,5);
    var minisphere= new THREE.Mesh(newSphereGeom, new THREE.MeshBasicMaterial({ color: 0x2266dd }));
    scene.add(minisphere);
    mouseSphere.push(minisphere);
  }



  /* Show the event in the log list */
  function showEventLog(event, color, diff) {
    $timeout(function () {
      // Create new row
      var logs = document.getElementById("logs");
      if (logs === null) {
        console.error("Logs table does not exists.");
        return;
      }
      var tr = logs.insertRow();
      //tr.innerHTML = ("<td style=\"color: " + color + "\">" + event.sensor + "</td><td>" + event.count + "</td><td>" + event.coords.lat + ","+ event.coords.lon + "</td>");
      // Remove extra elements
      // if (logs.children.length >= config.maximumEvents) {
      //   logs.deleteRow(0);
      // }
      if (logs.children.length <= 30) {
        //tr.innerHTML = ("<td style=\"color: " + color + "\">" + event.sensor + "</td><td>" + event.count + "</td><td>" + event.coords.lat + ","+ event.coords.lon + "</td>");
        tr.innerHTML = ("<td style=\"color: " + color + ";font-size:10px\">" + event.sensor + "</td><td style=\"font-size:10px\">" + event.count + "</td>");
      } 
      //console.log(event.sensor + " - " + event.count + " -  " + event.coords.lat + ","+ event.coords.lon);
    }, diff);
  }

  function renderEvents(list) {
    //console.log("renderEvents");
    if (list === null || typeof list == "undefined") {
      return;
    }
    var colorFnWrapper;
    var size;
    var subgeo = new THREE.Geometry();

    // calcul the diff between max and min to find step
    var nblegend = config.subset;
    var legende = [];
    var colors = [];
    var valeur = [];
    for (var i = 0; i < list.length; i++) {
      valeur[i]=list[i]["count"];
    }
    //var steplegend = (Math.max.apply(null,valeur) - Math.min.apply(null,valeur))/5;
    var minlegend =  Math.min.apply(null,valeur);
    var maxlegend =  Math.max.apply(null,valeur);
    console.log(minlegend);
    console.log(maxlegend);
    var stepgap  = ((maxlegend - minlegend) / nblegend)%1;
    var steplegend = Math.floor((maxlegend - minlegend)/nblegend);
    var zonemax=0;
    var zonemin=0;
    console.log(steplegend);
    //A REVOIR
    for (var j = 0; j < nblegend; j++) {
      if (j==0) {
        zonemax=minlegend+steplegend;
        console.log(zonemax);
        colors=[{'name': minlegend + ' - '+ zonemax , 'color': '#'+colorFn(j+1).getHexString()}];
      } else {
        zonemin=zonemax+1;
        if (((stepgap*j)%1)<0.5) {
          zonemax=zonemax+steplegend;
        } else {
          zonemax=zonemax+steplegend+1;
          
        }
        colors.push({'name': zonemin + ' - ' +  zonemax, 'color': '#'+colorFn(j+1).getHexString()});
      }
    }
    var texte;
    //delete rows if they are already exists
    var leg = document.getElementById("legende");
    var B=leg.getElementsByTagName('tbody');
    while (leg.hasChildNodes()) {   
      leg.removeChild(leg.firstChild);
    }
    for (var k = 0; k < colors.length; k++) {
      var tr = leg.insertRow();
      tr.innerHTML="<td style=\"color: " + colors[k].color + ";font-size:10px\">"+ colors[k].name + "</td>";
    }

    var typecouleur;
    var color;
    for (var i = 0; i < list.length; i++) {
      //get coordinates
      var coords = list[i]["coords"];
      //get color
      for (var j = nblegend-1; j >= 0; j--) {
        if ((list[i]["count"] < legende[j]) && (list[i]["count"] > legende[j-1])) {
            typecouleur=j;
            //console.log(typecouleur);
            break;
        }
      }
      color = colorFn(typecouleur);
      //get size
      size = list[i]["count"];
      
      if (config.echelle<0) {
        size = size/(Math.abs(config.echelle));
      }else{
        if (config.echelle==0) {
          size = size;
        } else {
          size = size*(config.echelle);
        }
      }
      //console.log(config.echelle);
      
      //add point on shere
      addPoint(coords.lat, coords.lon, size, color,subgeo,list[i].sensor);
      //add data on right scree
      showEventLog(list[i], '#'+color.getHexString());
    }
  }

  function addPoint(lat, lng, size, color, subgeo, nom) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;
    //var point = new THREE.Geometry();
    point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 200 * Math.cos(phi);
    point.position.z = 200 * Math.sin(phi) * Math.sin(theta);
    point.lookAt(mesh.position);

    point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix  0.1
    point.updateMatrix();
    for (var i = 0; i < point.geometry.faces.length; i++) {
      point.geometry.faces[i].color = color;  
    }
    if(point.matrixAutoUpdate){
      point.updateMatrix();
    }
    //console.log(size);
    subgeo.merge(point.geometry, point.matrix);
    datapoints = new THREE.Mesh(subgeo, new THREE.MeshBasicMaterial({color: color,vertexColors: THREE.FaceColors,morphTargets: true}));
    datapoints.name = nom;
    //http://ahighfive.com/2013/03/scaling-a-three-js-geometry-using-morphtargets/
    //console.log(datapoints);
    scene.add(datapoints);
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = -event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
    idleTime = 0;
  }
  function onDocumentMouseMove( event )  {
      // the following line would stop any other event handler from firing
      // (such as the mouse's TrackballControls)
      //event.preventDefault();
      
      // update the mouse variable
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      //console.log(mouse);
  }
  function onMouseMove(event) {
    mouse.x = -event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance / 1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
  }

  function onMouseUp() {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut() {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      // Support for chrome and firefox
      var delta = event.wheelDeltaY ? event.wheelDeltaY * 0.3 : -event.detail * 10;
      zoom(delta);
    }
    return false;
  }
  function CheckMouseSphere(){
      // if the coordinates exist, make the sphere visible
      if(mouseSphereCoords != null){
          //console.log(mouseSphereCoords[0].toString()+","+mouseSphereCoords[1].toString()+","+mouseSphereCoords[2].toString());
          mouseSphere[0].position.set(mouseSphereCoords[0],mouseSphereCoords[1],mouseSphereCoords[2]);
          mouseSphere[0].visible = true;
          //console.log(mouseSphere);
      }
      else{ // otherwise hide the sphere
          mouseSphere[0].visible = false;
      }
  }
  function checkHighlight(){

      var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
      var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
      
      var intersects = ray.intersectObjects( scene.children);
      if ( intersects.length > 0 ) {   // case if mouse is not currently over an object
        if (intersects[0].object.name != '') {
          console.log(intersects[0].object.name);
          console.log(intersects[0]);
          intersects[0].face.color=new THREE.Color( 0x44dd66 );
        }
        mouseSphereCoords = [intersects[0].point.x,intersects[0].point.y,intersects[0].point.z];
        // for (var k = 0; k < intersects.length; k++) {
        //   console.log(intersects[k].object.name);
        //   if (intersects[k].object.name != "") {
        //     console.log(intersects[k].object.name);
        //   }
        // }
      } else {
        mouseSphereCoords = null;
      }


  }


  function animate() {
    // requestAnimationFrame(animate);
    // render();
    // checkHighlight();
    // CheckMouseSphere();
  }


  function render() {
    requestAnimationFrame(render);
    if (config.tooltip) {
      checkHighlight();
    }
    CheckMouseSphere();
    zoom(0);
    // if (config.rotation) {
    //   if (idleTime > 150) {
    //     /* Auto rotate when idling */
    //     rotation.x = (rotation.x + 0.005) % (2*Math.PI);
    //     rotation.y += (Math.PI / 6.0 - rotation.y) * 0.01;
    //     distance += (distanceTarget - distance) * 0.3;
    //   } else {
    //     /* Small rotation and zoom when creating the sphere + mouse move handle */
    //     rotation.x += (target.x - rotation.x) * 0.1;
    //     rotation.y += (target.y - rotation.y) * 0.1;
    //     distance += (distanceTarget - distance) * 0.3;
    //     idleTime++;
    //   }
    // }
    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(sphere.position);

    //animateLines();
    //animateOrigins();

    renderer.render(scene, camera);
  }
  this.clear = clear;
  this.setConfig = setConfig;
  this.init = init;
  //this.animate = animate;
  this.renderEvents = renderEvents;
  this.render = render;

  return this;
};

module.exports = new Globe();