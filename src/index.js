import dummy from './OrbitControls';
import SolarSystem from './SolarSystem';
import dat from 'dat.gui';
import * as loaders from 'waves-loaders';
import * as audio from 'waves-audio';

let durationAbs = false,
    periodVar = false,
    positionVar = false;

async function init() {
  const loader = new loaders.AudioBufferLoader();
  const buffers = await loader.load([
    './assets/cherokee.wav',
    // './assets/pierres.mp3',
    // './assets/sable.mp3',
    ]);

  const sceneEl = document.querySelector('#scene');
  let numPlanets = 20;

  const system = new SolarSystem(numPlanets);
  system.init(sceneEl);

  const engines = [];
  const scheduler = audio.getScheduler();

  for (let i = 0; i < numPlanets; i++) {

    const granularEngine = new audio.GranularEngine();
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];
    const position = buffer.duration * Math.random();
    
    granularEngine.connect(audio.audioContext.destination);
    granularEngine.buffer = buffer;
    granularEngine.position = position;
    granularEngine.positionVar = 0.01;
    granularEngine.durationAbs = 0.2;
    granularEngine.periodAbs = 0.02;
    granularEngine.periodVar = 0.005;
    granularEngine.resampling = -600;

    scheduler.add(granularEngine);
    engines[i] = granularEngine;
  }

  system.addListener('steers', steersStack => {
    for (let i = 0; i < numPlanets; i++) {
      let value = steersStack[i];
      // value = value * 1e8; // [0, 100]
      // value = value / 100; // [0, 1]
      // value = Math.max(0, Math.min(1, value));
      value = Math.min(value, 1);

      const dist = Math.sqrt(1 - value)
      const resampling = -1 * (600 * dist + 600);
      const periodAbs = (0.05 - 0.02) * dist + 0.02; // 0.02, 0.15

      // console.log(resampling);
      engines[i].resampling = resampling;
      engines[i].gain = Math.sqrt(value);
      engines[i].periodAbs = periodAbs;

      if (durationAbs) {
        engines[i].durationAbs = value;
      }

      if (periodVar) {
        engines[i].periodVar = 1 - value;
      }

      if (positionVar) {
        engines[i].positionVar = value;
      }
    }
  });

  const gui = new dat.GUI({ height: 159 });

  gui.add({'gamma': 0.5}, 'gamma').min(.0001).max(.5).step(.005).onChange(newGamma => {
    system.gamma = newGamma;
  });

  gui.add({'planets': numPlanets}, 'planets').min(1).max(30).step(1).onChange(newPlanetsLen => {
    const offset = newPlanetsLen - system.planetsLen;

    for(let i = 0; i < Math.abs(offset); i++) {
      const method = offset > 0 ? 'createPlanet' : 'deletePlanet';
      system[method]();

      if (method === 'createPlanet') {
        numPlanets++;
        const granularEngine = new audio.GranularEngine();
        const buffer = buffers[Math.floor(Math.random() * buffers.length)];
        const position = buffer.duration * Math.random();
        
        granularEngine.connect(audio.audioContext.destination);
        granularEngine.buffer = buffer;
        granularEngine.position = position;
        granularEngine.positionVar = 0.01;
        granularEngine.durationAbs = 0.2;
        granularEngine.periodAbs = 0.02;
        granularEngine.periodVar = 0.005;
        granularEngine.resampling = -600;

        scheduler.add(granularEngine);
        engines[numPlanets-1] = granularEngine;
      } else {
        numPlanets--;

        if (engines[numPlanets]) {
          const granularEngine = engines[numPlanets];
          scheduler.remove(granularEngine);
          engines.splice(numPlanets, 1);
        }
      }
    }

    system.planetsLen = newPlanetsLen;
  });

  gui.add({'maxTrail': 2500}, 'maxTrail').min(10).max(10000).step(1).onChange(newMaxTrail => {
    system.maxTrail = newMaxTrail;
  });

  gui.add({'showTrail': true}, 'showTrail').onChange(showTrail => {
    system.showTrail = showTrail;
  });

  gui.add({'durationAbs': false}, 'durationAbs').onChange(isDurationAbs => {
    durationAbs = isDurationAbs;
    if (!isDurationAbs) {
      granularEngine.durationAbs = 0.2;
    }
  });

  gui.add({'periodVar': false}, 'periodVar').onChange(isPeriodVar => {
    periodVar = isPeriodVar;
    if (!isPeriodVar) {
      granularEngine.periodVar = 0.005;
    }
  });

  gui.add({'positionVar': false}, 'positionVar').onChange(isPositionVar => {
    positionVar = isPositionVar;
    if (!isPositionVar) {
      granularEngine.positionVar = 0.01;
    }
  });


  // gui.add({'position': engines[0].position}, 'position').min(0).max(engines[0].buffer.duration).step(.001).onChange(position => {
  //   engines[0].position = position;
  // });

  // gui.add({'positionVar': engines[0].positionVar}, 'positionVar').min(0).max(1).step(.001).onChange(positionVar => {
  //   engines[0].positionVar = positionVar;
  // });

  // gui.add({'periodAbs': engines[0].periodAbs}, 'periodAbs').min(0).max(0.04).step(.00001).onChange(periodAbs => {
  //   engines[0].periodAbs = periodAbs;
  // });

  // Fill el

  window.addEventListener('resize', e => {
    system.resize();
  });
}

window.addEventListener('load', init);
