import dummy from './OrbitControls';
import SolarSystem from './SolarSystem';
import dat from 'dat.gui';

const init = () => {
  const $scene = document.querySelector('#scene');

  const system = new SolarSystem();
  system.init($scene);

  const gui = new dat.GUI({ height: 159 });

  gui.add({'gamma': 0.05}, 'gamma').min(.0001).max(.5).step(.005).onChange(newGamma => {
    system.gamma = newGamma;
  });

  gui.add({'planets': 30}, 'planets').min(1).max(300).step(1).onChange(newPlanetsLen => {
    const offset = newPlanetsLen - system.planetsLen;

    for(let i = 0; i < Math.abs(offset); i++) {
      const method = offset > 0 ? 'createPlanet' : 'deletePlanet';
      system[method]();
    }

    system.planetsLen = newPlanetsLen;
  });

  gui.add({'maxTrail': 500}, 'maxTrail').min(10).max(10000).step(1).onChange(newMaxTrail => {
    system.maxTrail = newMaxTrail;
  });

  gui.add({'showTrail': true}, 'showTrail').onChange(showTrail => {
    system.showTrail = showTrail;
  });

  // Fill el

  window.addEventListener('resize', e => {
    system.resize();
  });
}

window.addEventListener('load', init);
