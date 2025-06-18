document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("audioInput");
  const loading = document.getElementById("loading");
  const transcriptionBox = document.getElementById("transcription");

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      alert("Please select an audio file.");
      return;
    }

    transcriptionBox.textContent = "";
    loading.classList.remove("hidden");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await fetch("/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed. Try again.");
      }

      const result = await response.json();

      transcriptionBox.textContent = result.transcription || "No transcription returned.";
    } catch (error) {
      console.error("Error during transcription:", error);
      transcriptionBox.textContent = "Error: " + error.message;
    } finally {
      loading.classList.add("hidden");
    }
  });
});

