import React from "react";
import { useCarbonFootprint } from "../hooks";

const CarbonFootprintDisplay = () => {
  const { footprint } = useCarbonFootprint();

  return (
    <div className="carbon-footprint-page" style={{ padding: "1.5rem" }}>
      <h2>Carbon Footprint Monitor</h2>
      <p>
        <strong>Bytes transferred:</strong> {footprint.totalBytes.toLocaleString()} bytes
      </p>
      <p>
        <strong>Estimated CO2 emissions:</strong> {footprint.estimatedCO2g.toFixed(4)} g
      </p>
      <p>
        <strong>Estimated CO2 emissions:</strong> {footprint.estimatedCO2kg.toFixed(6)} kg
      </p>
      <p>
        <strong>Connection type:</strong> {footprint.connectionType}
      </p>
      <p>
        <strong>Emission factor:</strong> {footprint.emissionFactor} g CO2 per MB
      </p>
      <p>
        This component monitors network resource transfers and estimates emissions using the Sustainable Web Design model.
      </p>
      <p>
        <em>Note: Emissions may appear low initially. Interact with the app (navigate, load data) to see more activity.</em>
      </p>
    </div>
  );
};

export default CarbonFootprintDisplay;
