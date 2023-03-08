/** Declare element variables */
const toggleModeEl = document.getElementById("toggle-mode");
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");
const chipsEl = document.getElementById("chips");
const darkModeCss = document.getElementById("jsapi-mode-dark");
const lightModeCss = document.getElementById("jsapi-mode-light");

/** Declare expected type values */
const allTypes = [
  "National park or forest",
  "State park or forest",
  "Regional park",
  "County park",
  "Local park",
];

/** Declare  colors to assign to each type - these will also be used in CSS */
const typeColors = ["#c66a4a", "#7a81ff", "#3cccb4", "#0096ff", "#f260a1"];

/** Create a simple state object and set the default filter to allTypes */
const appState = {
  types: allTypes,
  mode: "light",
};

/** Maps SDK */
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate",
], (Map, MapView, FeatureLayer, Home, Locate) =>
  (async () => {
    toggleModeEl.addEventListener("click", () => handleModeChange());
    toggleModalEl.addEventListener("click", () => handleModalChange());

    const layer = new FeatureLayer({
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Parks/FeatureServer/0",
      outFields: ["*"],
      popupTemplate: createPopupTemplate(),
      minScale: 0,
      maxScale: 0,
      renderer: {
        type: "unique-value",
        field: "FEATTYPE",
        uniqueValueInfos: assignColorsToTypes(),
      },
    });

    const map = new Map({
      basemap: "topo-vector",
      layers: [layer],
    });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      center: [-120, 45],
      zoom: 4,
    });

    /** Ensure smaller features are visible on top of larger ones */
    layer.orderBy = {
      field: "SQMI",
      order: "ascending",
    };

    const locateBtn = new Locate({ view: view });
    const homeWidget = new Home({ view: view });

    view.ui.add(homeWidget, "top-left");
    view.ui.add(locateBtn, { position: "top-left" });

    function createPopupTemplate() {
      return {
        title: "{NAME}",
        content: "{SQMI} square miles, jurisdiction: {FEATTYPE}",
      };
    }

    /** Assign the color values to expected type values */
    function assignColorsToTypes() {
      let uniqueValueInfos = [];
      allTypes.forEach((type, index) => {
        uniqueValueInfos.push({
          value: type,
          symbol: {
            type: "simple-fill",
            color: typeColors[index],
            outline: { color: typeColors[index] },
          },
        });
      });
      return uniqueValueInfos;
    }

    /** Create the chips to represent each jurisdiction */
    function createFilterChips() {
      allTypes.forEach((item) => {
        const chip = document.createElement("calcite-chip");
        const simpleName = item.split(" ")[0];
        const isActive = appState.types.includes(item);
        chip.tabIndex = 0;
        chip.innerText = simpleName;
        chip.value = simpleName;
        chip.id = `chip-type-${simpleName.toLowerCase()}`;
        chip.icon = isActive ? "check-circle-f" : "circle";
        chip.classList = isActive ? "chip-active" : undefined;
        chip.addEventListener("click", (event) =>
          handleChipChange(event, item)
        );
        chip.addEventListener("keydown", (event) => {
          if (event.key === " " || event.key === "Enter") {
            handleChipChange(event, item);
          }
        });
        chipsEl.appendChild(chip);
      });
    }

    function createWhereArguments() {
      let args = [];
      const typesActive = appState.types.length > 0;
      const featureTypes = typesActive ? appState.types : allTypes;
      featureTypes.forEach((j) => args.push(`'${j}'`));
      const filtered = ` AND (FEATTYPE = ${args.join(" OR FEATTYPE = ")})`;
      const unfiltered = ` AND FEATTYPE != ${args.join(" AND FEATTYPE != ")}`;
      const argString = typesActive ? filtered : unfiltered;
      return argString;
    }

    async function handleLayerFilter() {
      await view.whenLayerView(layer).then((featureLayerView) => {
        const where = `NAME IS NOT NULL${createWhereArguments()}`;
        featureLayerView.featureEffect = {
          filter: { where },
          excludedEffect: "opacity(30%) grayscale(100%)",
          includedEffect: "opacity(100%)",
        };
      });
    }

    function handleChipChange(event, value) {
      let items = appState.types;
      const isActive = !items.includes(value);
      event.target.icon = isActive ? "check-circle-f" : "circle";
      event.target.classList = isActive ? "chip-active" : undefined;
      if (isActive) {
        items.push(value);
      } else {
        items = items.filter((item) => item !== value);
      }
      appState.types = items;
      handleLayerFilter();
    }

    function handleModeChange() {
      appState.mode = appState.mode === "dark" ? "light" : "dark";
      const isDarkMode = appState.mode === "dark";
      darkModeCss.disabled = !darkModeCss.disabled;
      lightModeCss.disabled = !lightModeCss.disabled;
      map.basemap = isDarkMode ? "streets-night-vector" : "topo-vector";
      toggleModeEl.icon = isDarkMode ? "moon" : "brightness";
      document.body.className = isDarkMode ? "calcite-mode-dark" : undefined;
    }

    function handleModalChange() {
      modalEl.open = !modalEl.open;
    }

    function initializeApp() {
      createFilterChips();
      handleLayerFilter();
    }

    initializeApp();
  })());
