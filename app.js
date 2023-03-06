const allTypes = [
  "National park or forest",
  "State park or forest",
  "Regional park",
  "County park",
  "Local park",
];
const colors = ["#c66a4a", "#7a81ff", "#3cccb4", "#0096ff", "#f260a1"];

const appState = {
  types: allTypes,
  mode: "light",
};

const renderer = {
  type: "unique-value",
  field: "FEATTYPE",
  uniqueValueInfos: [
    {
      value: "National park or forest",
      symbol: {
        type: "simple-fill",
        color: colors[0],
        outline: { color: colors[0] },
      },
    },
    {
      value: "State park or forest",
      symbol: {
        type: "simple-fill",
        color: colors[1],
        outline: { color: colors[1] },
      },
    },
    {
      value: "Regional park",
      symbol: {
        type: "simple-fill",
        color: colors[2],
        outline: { color: colors[2] },
      },
    },
    {
      value: "County park",
      symbol: {
        type: "simple-fill",
        color: colors[3],
        outline: { color: colors[3] },
      },
    },
    {
      value: "Local park",
      symbol: {
        type: "simple-fill",
        color: colors[4],
        outline: { color: colors[4] },
      },
    },
  ],
};

const toggleModeEl = document.getElementById("toggle-mode");
const toggleModalEl = document.getElementById("toggle-modal");
const modalEl = document.getElementById("modal");
const chipsEl = document.getElementById("chips");
const darkModeCss = document.getElementById("jsapi-mode-dark");
const lightModeCss = document.getElementById("jsapi-mode-light");

require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Home",
  "esri/widgets/Locate",
], (Map, MapView, FeatureLayer, Home, Locate) =>
  (async () => {
    toggleModeEl.addEventListener("click", () => handleModeChange());
    toggleModalEl.addEventListener(
      "click",
      () => (modalEl.open = !modalEl.open)
    );

    const layer = new FeatureLayer({
      url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Parks/FeatureServer/0",
      outFields: ["*"],
      renderer: renderer,
      popupTemplate: createPopupTemplate(),
      minScale: 0,
      maxScale: 0,
    });

    const map = new Map({
      basemap: "topo-vector",
      layers: [layer],
    });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      center: [-120, 45],
      zoom: 3,
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

    /** Create the chips to represent each jurisdiction */
    /** Assign a selector to style uniquely */
    /** Add event listeners to filter on after interaction */
    function createFilterChips() {
      allTypes.map((item) => {
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
          handleChipSelection(event, item)
        );
        chip.addEventListener("keydown", (event) => {
          if (event.key === " " || event.key === "Enter") {
            handleChipSelection(event, item);
          }
        });
        chipsEl.appendChild(chip);
      });
    }

    function createPopupTemplate() {
      return {
        title: "{NAME}",
        content: "{SQMI} square miles, jurisdiction: {FEATTYPE}",
      };
    }

    function getWhereArgs() {
      let args = [];
      const typesActive = appState.types.length > 0;
      const featureTypes = typesActive ? appState.types : allTypes;
      featureTypes.map((j) => args.push(`'${j}'`));
      const filtered = ` AND (FEATTYPE = ${args.join(" OR FEATTYPE = ")})`;
      const unfiltered = ` AND FEATTYPE != ${args.join(" AND FEATTYPE != ")}`;
      const argString = typesActive ? filtered : unfiltered;
      return argString;
    }

    async function setFeatureLayerViewFilter() {
      await view.whenLayerView(layer).then((featureLayerView) => {
        const where = `NAME IS NOT NULL${getWhereArgs()}`;
        featureLayerView.featureEffect = {
          filter: { where },
          excludedEffect: "opacity(20%) grayscale(100%)",
          includedEffect: "opacity(100%)",
        };
      });
    }

    function handleChipSelection(event, value) {
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
      setFeatureLayerViewFilter();
    }

    function handleModeChange() {
      appState.mode = appState.mode === "dark" ? "light" : "dark";
      const isDark = appState.mode === "dark";
      darkModeCss.disabled = !darkModeCss.disabled;
      lightModeCss.disabled = !lightModeCss.disabled;
      map.basemap = isDark ? "streets-night-vector" : "topo-vector";
      toggleModeEl.icon = isDark ? "moon" : "brightness";
      document.body.className = isDark ? "calcite-mode-dark" : undefined;
    }

    function initializeApp() {
      createFilterChips();
      setFeatureLayerViewFilter();
    }

    initializeApp();
  })());
