import plateImg from "../License_plate_of_Ukraine_2015.png";

export default function LicensePlateImage({ text }) {
  return (
    <div style={{ position: "relative", width: 220 }}>
      <img
        src={plateImg}
        alt="license plate"
        style={{ width: "100%", display: "block" }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "53%",
          transform: "translate(-50%, -50%)",
          fontSize: "28px",
          fontWeight: "400",
          letterSpacing: "4px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          backgroundColor: "white",
          width: "190px",
          height: "40px",
          textAlign: "center"
        }}
      >
        {text}
      </div> 
    </div>
  );
}
