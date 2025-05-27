async function parseResume() {
    const username = document.getElementById("username").value.trim();
    const fileInput = document.getElementById("resume").files[0];

    if (!username || !fileInput) {
        alert("Please enter a username and upload a resume.");
        return;
    }

    if (fileInput.type === "application/pdf") {
        readPDF(fileInput, username);
    } else if (fileInput.name.endsWith(".docx")) {
        readDOCX(fileInput, username);
    } else {
        alert("Invalid file format. Upload a PDF or DOCX file.");
    }
}

// 📌 Read and Extract Text from PDF
async function readPDF(file, username) {
    if (!window.pdfjsLib) {
        alert("PDF.js failed to load. Check your internet connection.");
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

    const fileReader = new FileReader();
    fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            let page = await pdf.getPage(i);
            let content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + " ";
        }

        extractDetails(username, text);
    };
    fileReader.readAsArrayBuffer(file);
}

// 📌 Read and Extract Text from DOCX
function readDOCX(file, username) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Use Mammoth to extract text from DOCX
        mammoth.extractRawText({ arrayBuffer })
            .then(function (result) {
                extractDetails(username, result.value);
            })
            .catch(function (error) {
                alert("Error reading DOCX file.");
                console.error(error);
            });
    };
    reader.readAsArrayBuffer(file);
}

// 📌 Extract Structured Data from Resume Text
function extractDetails(username, text) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const phoneRegex = /\b\d{10,12}\b/;
    const linkedinRegex = /https?:\/\/(www\.)?linkedin\.com\/[^\s]+/;
    const githubRegex = /https?:\/\/(www\.)?github\.com\/[^\s]+/;
    const nameRegex = /(?:Name|Full Name|Profile):?\s*([A-Za-z\s]+)/i;
    const skillsRegex = /(?:Skills|Technical Skills):?\s*(.+)/i;
    const educationRegex = /(?:Education|Qualification):?\s*(.+)/i;
    const internshipRegex = /(?:Internship|Experience):?\s*(.+)/i;
    const projectsRegex = /(?:Projects|Work Experience):?\s*(.+)/i;
    const certificationsRegex = /(?:Certifications|Courses):?\s*(.+)/i;

    const extractedData = {
        username: username,
        name: text.match(nameRegex) ? text.match(nameRegex)[1].trim() : "Not found",
        email: text.match(emailRegex) ? text.match(emailRegex)[0] : "Not found",
        phone: text.match(phoneRegex) ? text.match(phoneRegex)[0] : "Not found",
        linkedin: text.match(linkedinRegex) ? text.match(linkedinRegex)[0] : "Not found",
        github: text.match(githubRegex) ? text.match(githubRegex)[0] : "Not found",
        skills: text.match(skillsRegex) ? text.match(skillsRegex)[1].split(",").map(s => s.trim()) : [],
        education: text.match(educationRegex) ? text.match(educationRegex)[1] : "Not found",
        internships: text.match(internshipRegex) ? text.match(internshipRegex)[1] : "Not found",
        projects: text.match(projectsRegex) ? text.match(projectsRegex)[1] : "Not found",
        certifications: text.match(certificationsRegex) ? text.match(certificationsRegex)[1].split(",").map(c => c.trim()) : []
    };

    document.getElementById("output").textContent = JSON.stringify(extractedData, null, 2);
}
