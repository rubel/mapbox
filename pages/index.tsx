/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_KEY } from "../misc/Consts";
import axios from "axios";

interface SchoolMarker {
  ADDRESS3: string;
  ADMPOL: string;
  AGEHIGH: number;
  AGELOW: number;
  CLOSEDATE: string;
  ESTAB: number;
  GENDER: string;
  ISPOST16: number;
  ISPRIMARY: number;
  ISSECONDARY: number;
  LA: number;
  LAESTAB: number;
  LANAME: string;
  LATITUDE: number;
  LOCALITY: string;
  LONGITUDE: number;
  MINORGROUP: string;
  NOR: number;
  NORB: number;
  NORFSMEVER: number;
  NORG: number;
  NUMEAL: number;
  NUMENGFL: number;
  NUMFSM: number;
  NUMFSMEVER: number;
  NUMUNCFL: number;
  OFSTEDLASTINSP: string;
  OFSTEDRATING: string;
  OPENDATE: string;
  PNORB: number;
  PNORG: number;
  PNUMEAL: number;
  PNUMENGFL: number;
  PNUMFSMEVER: number;
  PNUMUNCFL: number;
  POSTCODE: string;
  PSENELK: number;
  PSENELSE: number;
  RELCHAR: string;
  SCHNAME: string;
  SCHOOLTYPE: string;
  SCHSTATUS: string;
  STREET: string;
  TOWN: string;
  TSENELK: number;
  TSENELSE: number;
  URN: number;
  id: number;
}

const Home: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [center, setCenter] = useState({
    lat: 53.3990629190367,
    lng: -2.92313763005851,
  });
  const [map, setMap] = useState<Map | null>(null);

  const [bounds, setBounds] = useState<{
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  }>({
    latMin: 0,
    latMax: 0,
    lngMin: 0,
    lngMax: 0,
  });

  const [markers, setMarkers] = useState<SchoolMarker[]>([]);

  const loadSchoolsOfNewBounds = async () => {
    try {
      const response = await axios.get(
        `https://admission-backend-nu.vercel.app/api/school/search`,
        {
          params: {
            latmin: bounds.latMin,
            latmax: bounds.latMax,
            lngmin: bounds.lngMin,
            lngmax: bounds.lngMax,
          },
        }
      );
      console.log(response?.data?.data);
      setMarkers(response?.data?.data);
    } catch (error) {
      console.error("Error fetching school data:", error);
    }
  };

  const getMarkerIcon = (rating: string) => {
    const ratings = [
      "Outstanding",
      "Good",
      "Requires improvement",
      "Inadequate",
      "Special Measures",
      "Serious Weaknesses",
    ];
    const svgs = [
      "marker-school-outstanding.svg",
      "marker-school-good.svg",
      "marker-school-requires-improvement.svg",
      "marker-school-inadequate.svg",
      "marker-school-inadequate.svg",
      "marker-school-inadequate.svg",
    ];

    return ratings.indexOf(rating) >= 0
      ? svgs[ratings.indexOf(rating)]
      : "marker-school-gray.svg";
  };

  useEffect(() => {
    loadSchoolsOfNewBounds();
  }, [bounds]);

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = MAPBOX_KEY;
    }

    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLElement,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: 12,
    });

    setMap(newMap);

    newMap.on("load", () => {
      newMap.addSource("markers", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: markers.map((marker) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [marker?.LONGITUDE, marker?.LATITUDE],
            },
            properties: {
              description: marker?.SCHNAME,
              color: marker?.OFSTEDRATING,
            },
          })),
        },
      });

      newMap.addLayer({
        id: "markers",
        type: "circle",
        source: "markers",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 10,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      newMap.on("click", "markers", (e) => {
        const feature = e.features?.[0];
        if (feature && feature.geometry.type === "Point") {
          const coordinates = feature.geometry.coordinates as [number, number];
          const description = feature.properties?.description;

          if (coordinates) {
            newMap.panTo(coordinates, { duration: 1000 });

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(description || "")
              .addTo(newMap);
          }
        }
      });
    });

    const updateBounds = () => {
      const mapBounds = newMap.getBounds();
      setBounds({
        latMin: mapBounds?.getSouth() || 0,
        latMax: mapBounds?.getNorth() || 0,
        lngMin: mapBounds?.getWest() || 0,
        lngMax: mapBounds?.getEast() || 0,
      });
    };

    newMap.on("move", updateBounds);
    newMap.on("zoom", updateBounds);

    updateBounds();

    return () => {
      newMap.remove();
    };
  }, []);

  useEffect(() => {
    if (map) {
      // Clear existing markers

      const source = map.getSource("markers") as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      // Add SVG file path markers
      markers.forEach((marker) => {
        const markerElement = document.createElement("div");

        // Style the marker element to use an SVG file as the marker
        markerElement.style.width = "40px";
        markerElement.style.height = "40px";
        markerElement.style.backgroundImage = `url(${getMarkerIcon(
          marker.OFSTEDRATING
        )})`;
        markerElement.style.backgroundSize = "contain";
        markerElement.style.backgroundRepeat = "no-repeat";
        markerElement.style.cursor = "pointer";

        // Add click event listener
        markerElement.addEventListener("click", () => {
          map.flyTo({
            center: [marker.LONGITUDE, marker.LATITUDE],
            zoom: 14,
          });
        });

        new mapboxgl.Marker(markerElement)
          .setLngLat([marker.LONGITUDE, marker.LATITUDE])
          .setPopup(new mapboxgl.Popup().setText(marker.SCHNAME))
          .addTo(map);
      });
    }
  }, [markers, map]);

  return (
    <div>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "calc(100vh - 0px)" }}
      />
      <div
        style={{
          background: "#343434",
          color: "white",
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "20px",
        }}
      >
        <p>
          <strong>Current Map Bounds:</strong>
        </p>
        <p>Min Latitude: {bounds.latMin}</p>
        <p>Max Latitude: {bounds.latMax}</p>
        <p>Min Longitude: {bounds.lngMin}</p>
        <p>Max Longitude: {bounds.lngMax}</p>
      </div>
    </div>
  );
};

export default Home;
