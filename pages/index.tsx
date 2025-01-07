import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_KEY } from "./Consts";

interface MarkerData {
  lng: number;
  lat: number;
  description: string;
  color: string;
}

const Home: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [bounds, setBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }>({
    minLat: 0,
    maxLat: 0,
    minLng: 0,
    maxLng: 0,
  });

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = MAPBOX_KEY;
    }

    const map: Map = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLElement,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-74.5, 40],
      zoom: 12,
    });

    

    const markers: MarkerData[] = [
      { lng: -74.5, lat: 40, description: "Marker 1", color: "crimson" },
      { lng: -74.56, lat: 40.01, description: "Marker 2", color: "#0ff000" },
      { lng: -74.54, lat: 39.97, description: "Marker 3", color: "#5d5555" },
    ];

    markers.forEach(({ lng, lat, description, color }) => {
      const markerElement = document.createElement("div");
      markerElement.style.width = "30px";
      markerElement.style.height = "30px";
      markerElement.style.backgroundColor = color;
      markerElement.style.borderRadius = "50%"; // Make it circular
      markerElement.style.border = "7px solid white"; // Optional: Adds a white border for visibility

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setText(description))
        .addTo(map);

      // Add click event to pan the map to the clicked marker
      marker.getElement().addEventListener("click", () => {
        map.panTo([lng, lat], { duration: 1000 }); // Pan to the clicked marker with animation
      });
    });

    // Update the bounds whenever the map is moved or zoomed
    const updateBounds = () => {
      const mapBounds = map.getBounds();
      setBounds({
        minLat: mapBounds?.getSouth() || 0,
        maxLat: mapBounds?.getNorth() || 0,
        minLng: mapBounds?.getWest() || 0,
        maxLng: mapBounds?.getEast() || 0,
      });
    };

    // Add event listeners for map movement and zoom
    map.on("move", updateBounds);
    map.on("zoom", updateBounds);

    // Initial bounds update
    updateBounds();

    return () => {
      map.remove();
    };
  }, []);


  return (
    <div>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "calc(100vh - 0px)" }}
      />
      <div style={{background:'#343434',color:'white',position:'absolute',top:'10px',left:'10px', padding:'20px', }}>
        <p>
          <strong>Current Map Bounds:</strong>
        </p>
        <p>Min Latitude: {bounds.minLat}</p>
        <p>Max Latitude: {bounds.maxLat}</p>
        <p>Min Longitude: {bounds.minLng}</p>
        <p>Max Longitude: {bounds.maxLng}</p>
      </div>
    </div>
  );
};

export default Home;
