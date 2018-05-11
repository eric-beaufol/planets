import * as THREE from 'three';
import EventEmitter from 'events';
console.log(THREE.OrbitControls)

class SolarSystem extends EventEmitter {
  constructor(numPlanets) {
    super();

    this.planetsLen = 1 + numPlanets;
    this.planets = [];
    this.gamma = .05;
    this.maxTrail = 500;
    this.showTrail = true;

    this.renderLoop = this.renderLoop.bind(this);

    this.steersStack = [];
  }

  init($el) {
    this.scene = new THREE.Scene();

    // this.scene.fog = new THREE.Fog(0x000000, 0.015, 3000);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 6500000);
    const hyp = (window.innerWidth/2) / Math.sin(22.5 * (Math.PI/180));
    const height = Math.ceil(Math.sqrt(Math.pow(hyp, 2) - Math.pow((window.innerWidth/2), 2)));

    this.camZ = height * (window.innerHeight / window.innerWidth);

    this.camera.position.z = this.camZ + 500;
    this.camera.position.y = 0;

    this.renderer = new THREE.WebGLRenderer({antialias: !0});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(new THREE.Color(0x000000));


    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are
    this.controls.dampingFactor = 0.25;

    this.controls.screenSpacePanning = false;

    this.controls.minDistance = 100;
    this.controls.maxDistance = 50000;

    this.controls.maxPolarAngle = Math.PI / 2;

    this.planets = [];

    for (let i = 0; i < this.planetsLen; i++) {
      this.createPlanet(i);
    }

    // this.scene.add(this.universe);

    const axesHelper = new THREE.AxesHelper( 5 );
    this.scene.add(axesHelper);

    // var ambientLight = new THREE.AmbientLight(0xffffff);
    // this.scene.add(ambientLight);

    $el.appendChild(this.renderer.domElement);

    this.renderLoop();
  }

  resize() {
    if(this.renderer && this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  createPlanet() {
    const i = this.planets.length;

    const radius = i == 0 ? 20 : Math.random() * 10 + 5;
    const color = i == 0 ? 0xffffff : Math.random() * 0xffffff;

    const objectGeometry = new THREE.SphereGeometry(radius,  i == 0 ? 50 : 10,  i == 0 ? 50 : 10);
    const objectMaterial = new THREE.MeshBasicMaterial({color: color});

    const maxDistance = 200;
    const obj = new THREE.Mesh(objectGeometry, objectMaterial);
    const posX = i === 0 ? 0 : (Math.random() * 2 - 1) * maxDistance;
    const posY = i === 0 ? 0 : (Math.random() * 2 - 1) * maxDistance;
    const posZ = i === 0 ? 0 : (Math.random() * 2 - 1) * maxDistance;

    obj.position.set(posX, posY, posZ);

    const r = .5;
    const lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(obj.position.clone());

    const lineMaterial = new THREE.LineBasicMaterial({ color: color });
    const line = new THREE.Line(lineGeometry, lineMaterial);

    obj.data = {
      steering: new THREE.Vector3(0,0,0),
      velocity: new THREE.Vector3(
        i == 0 ? 0 : (Math.random() > .5 ? 1 : -1) * Math.random() * r,
        i == 0 ? 0 : (Math.random() > .5 ? 1 : -1) * Math.random() * r,
        i == 0 ? 0 : (Math.random() > .5 ? 1 : -1) * Math.random() * r
      ),
      mass: i == 0 ? 4000 : Math.random() * 5,
      line: line,
      lineMaterial: lineMaterial
    }

    this.planets.push(obj);
    this.scene.add(obj);
    this.scene.add(line);
  }

  deletePlanet() {
    var planet = this.planets.pop();

    this.scene.remove(planet.data.line);
    planet.data.line.geometry.dispose();
    planet.data.line.material.dispose();

    this.scene.remove(planet);
  }

  renderLoop() {
    // this.stats.update();
    this.controls.update();

    for (let i = 0; i < this.planets.length; i++) {
      const currObj = this.planets[i];
      const currVelocity = currObj.data.velocity.clone();

      for (let ii = 0; ii < this.planets.length; ii++) {
        const otherObj = this.planets[ii];

        if (otherObj !== currObj) {

          const massMultip = currObj.data.mass * otherObj.data.mass;
          const distance = Math.sqrt(
            Math.pow(otherObj.position.x - currObj.position.x, 2) +
            Math.pow(otherObj.position.y - currObj.position.y, 2) +
            Math.pow(otherObj.position.z - currObj.position.z, 2)
          );

          let gravitySteer = this.gamma * (massMultip / Math.pow(distance, 2));
          const normVecBetweenObj = currObj.position.clone().sub(otherObj.position).normalize();

          gravitySteer = normVecBetweenObj.multiplyScalar(gravitySteer);
          currVelocity.add(gravitySteer.divideScalar(currObj.data.mass));
        }
      }

      currObj.data.velocity = currVelocity;
      currObj.position.sub(currVelocity);

      this.scene.remove(currObj.data.line);
      currObj.data.line.geometry.dispose();
      currObj.data.line.material.dispose();

      const geometry = new THREE.Geometry();
        geometry.vertices = currObj.data.line.geometry.vertices.slice();
        geometry.vertices.push(currObj.position.clone());

      while(geometry.vertices.length > this.maxTrail) {
        geometry.vertices.shift();
      }

      const line = new THREE.Line(geometry, currObj.data.lineMaterial);

      if (this.showTrail) { 
        this.scene.add(line);
      }

      if (i > 0) {
        const massMultip = currObj.data.mass * 3;
        const distance = Math.sqrt(
          Math.pow(currObj.position.x - this.camera.position.x, 2) +
          Math.pow(currObj.position.y - this.camera.position.y, 2) +
          Math.pow(currObj.position.z - this.camera.position.z, 2)
        );

        const gravitySteer = this.gamma * (massMultip / Math.pow(distance, 2));
        this.steersStack[i - 1] = gravitySteer;
      }

      currObj.data.line = line;
    }

    //console.log(this.universe.children.length);
    this.emit('steers', this.steersStack);

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.renderLoop);
  }
}

export default SolarSystem;
