/* Configuration: institution, defaults, form fields, presets. */
(function () {
  'use strict';

  const INSTITUTION = {
    name: 'Bhawal Badre Alam Government College',
    shortName: 'BBAGC',
    location: 'Gazipur, Bangladesh',
    affiliation: 'National University, Bangladesh',
    logos: {
      // Order matters: local file first (reliable for PDF/JPG export), then the remote URL.
      nu: [
        'assets/nu-logo.png',
        'https://thumb.wikimedia.org/wikipedia/en/thumb/5/58/National_University%2C_Bangladesh_crest.svg/1280px-National_University%2C_Bangladesh_crest.svg.png'
      ],
      college: [
        'assets/bbagc-logo.png',
        'https://bbagc.eshiksabd.com/image/dclogo.png'
      ]
    }
  };

  const CREDIT = { name: 'Tanjid Shuvro', url: 'https://rjtanjid24.github.io/me' };

  /* Visitor counter. Remote counts use the free counterapi.dev service; if it cannot be reached
     the app falls back to counts stored in this browser. Set enabled:false to hide the counter. */
  const COUNTER = { enabled: true, base: 'https://api.counterapi.dev/v1', namespace: 'bbagc-cover-page-designer' };

  const DOC_TYPES = [
    'Assignment', 'Practical Notebook', 'Lab Report', 'Fieldwork Report', 'Excursion Report',
    'Group Project', 'Project Report', 'Presentation', 'Term Paper', 'Research Report', 'Other'
  ];

  const TEMPLATES = [
    { id: 'classic',   name: 'Classic Academic',   note: 'Centered, thin border' },
    { id: 'seal',      name: 'Official Seal',      note: 'Round college seal' },
    { id: 'formal',    name: 'Formal University',  note: 'Two logos, double line' },
    { id: 'minimal',   name: 'Modern Minimal',     note: 'Large title, rules' },
    { id: 'banner',    name: 'Bold Banner',        note: 'Color header block' },
    { id: 'practical', name: 'Practical Notebook', note: 'Experiment record table' },
    { id: 'science',   name: 'Science & Research', note: 'Structured info blocks' },
    { id: 'group',     name: 'Group Project',      note: 'Member table, supervisor' },
    { id: 'editorial', name: 'Creative Editorial', note: 'Asymmetric layout' }
  ];

  const COLOR_PRESETS = [
    { id: 'navy',     name: 'Academic Navy', p: '#14284b', s: '#b08d3c' },
    { id: 'emerald',  name: 'Emerald & Gold', p: '#0b6b4a', s: '#c8a24a' },
    { id: 'green',    name: 'Classic Green', p: '#1f5d3a', s: '#a8832f' },
    { id: 'burgundy', name: 'Burgundy',      p: '#6e1f33', s: '#b08d3c' },
    { id: 'bw',       name: 'Black & White', p: '#111111', s: '#555555' },
    { id: 'royal',    name: 'Royal Blue',    p: '#1d3fa0', s: '#c49a2b' },
    { id: 'teal',     name: 'Deep Teal',     p: '#0f5c63', s: '#d08a3a' },
    { id: 'forest',   name: 'Forest Green',  p: '#16402c', s: '#7a6a3a' },
    { id: 'plum',     name: 'Plum',          p: '#4a2a63', s: '#c0944a' },
    { id: 'grey',     name: 'Minimal Grey',  p: '#3b4048', s: '#8a9099' },
    { id: 'custom',   name: 'Custom Color',  p: null,      s: null }
  ];

  const FONTS = [
    { id: 'baskerville', name: 'Libre Baskerville (formal serif)', css: "'Libre Baskerville', 'Noto Serif Bengali', Georgia, serif" },
    { id: 'source',      name: 'Source Serif 4 (readable serif)',  css: "'Source Serif 4', 'Noto Serif Bengali', Georgia, serif" },
    { id: 'lora',        name: 'Lora (warm serif)',                css: "'Lora', 'Noto Serif Bengali', Georgia, serif" },
    { id: 'merri',       name: 'Merriweather (sturdy serif)',      css: "'Merriweather', 'Noto Serif Bengali', Georgia, serif" },
    { id: 'playfair',    name: 'Playfair Display (editorial)',     css: "'Playfair Display', 'Noto Serif Bengali', Georgia, serif" },
    { id: 'inter',       name: 'Inter (clean sans)',               css: "'Inter', 'Hind Siliguri', system-ui, sans-serif" },
    { id: 'poppins',     name: 'Poppins (rounded sans)',           css: "'Poppins', 'Hind Siliguri', system-ui, sans-serif" },
    { id: 'montserrat',  name: 'Montserrat (modern sans)',         css: "'Montserrat', 'Hind Siliguri', system-ui, sans-serif" },
    { id: 'hind',        name: 'Hind Siliguri (Bangla sans)',      css: "'Hind Siliguri', 'Inter', sans-serif" },
    { id: 'notosansbn',  name: 'Noto Sans Bengali (Bangla sans)',  css: "'Noto Sans Bengali', 'Inter', sans-serif" },
    { id: 'notoserifbn', name: 'Noto Serif Bengali (Bangla serif)', css: "'Noto Serif Bengali', Georgia, serif" },
    { id: 'tiro',        name: 'Tiro Bangla (Bangla classic)',     css: "'Tiro Bangla', 'Noto Serif Bengali', Georgia, serif" },
    { id: 'times',       name: 'Times New Roman',                  css: "'Times New Roman', Times, 'Noto Serif Bengali', serif" }
  ];

  const BORDERS = [
    { id: 'none', name: 'None' },
    { id: 'single', name: 'Single line' },
    { id: 'double', name: 'Double line' },
    { id: 'decorative', name: 'Decorative academic' },
    { id: 'corners', name: 'Minimal corners' }
  ];

  const PAGE_SIZES = {
    a4:     { name: 'A4',     w: 210,   h: 297 },
    letter: { name: 'Letter', w: 215.9, h: 279.4 },
    custom: { name: 'Custom', w: null,  h: null }
  };

  const PRACTICAL = ['Practical Notebook', 'Lab Report'];
  const OUTING = ['Fieldwork Report', 'Excursion Report'];

  /* Form schema. `show` lists the document types a field applies to (omit = always). */
  const FIELDS = [
    { group: 'Document', fields: [
      { id: 'docType', label: 'Document type', type: 'select', options: DOC_TYPES },
      { id: 'customDocType', label: 'Document type name', type: 'text', placeholder: 'e.g. Case Study', show: ['Other'] },
      { id: 'title', label: 'Title', type: 'text', placeholder: 'Assignment or report title', max: 160, wide: true },
      { id: 'subject', label: 'Subject name', type: 'text', placeholder: 'e.g. Botany', max: 80 },
      { id: 'subjectCode', label: 'Subject code', type: 'text', placeholder: 'e.g. 211101', max: 30 },
      { id: 'courseName', label: 'Course name', type: 'text', placeholder: 'e.g. Plant Anatomy', max: 100 },
      { id: 'courseCode', label: 'Course code', type: 'text', placeholder: 'e.g. 243013', max: 30 },
      { id: 'expNo', label: 'Experiment number', type: 'text', placeholder: 'e.g. 04', max: 20, show: PRACTICAL },
      { id: 'expTitle', label: 'Experiment title', type: 'text', placeholder: 'Name of the experiment', max: 160, wide: true, show: PRACTICAL },
      { id: 'expDate', label: 'Experiment date', type: 'date', show: PRACTICAL },
      { id: 'place', label: 'Place / destination', type: 'text', placeholder: 'e.g. Madhupur National Park', max: 100, wide: true, show: OUTING },
      { id: 'fieldDate', label: 'Date of visit', type: 'date', show: OUTING },
      { id: 'session', label: 'Academic session', type: 'text', placeholder: 'e.g. 2021-22', max: 20 },
      { id: 'submissionDate', label: 'Submission date', type: 'date' }
    ]},
    { group: 'Student', fields: [
      { id: 'studentName', label: 'Student name', type: 'text', placeholder: 'Full name', max: 80, wide: true },
      { id: 'roll', label: 'Roll / ID number', type: 'text', max: 30 },
      { id: 'reg', label: 'Registration number', type: 'text', max: 30 },
      { id: 'dept', label: 'Department', type: 'text', placeholder: 'e.g. Department of Botany', max: 80, wide: true },
      { id: 'program', label: 'Degree / program', type: 'text', placeholder: 'e.g. B.Sc. (Honours)', max: 60 },
      { id: 'year', label: 'Year', type: 'text', placeholder: 'e.g. 4th Year', max: 20 },
      { id: 'semester', label: 'Semester', type: 'text', max: 20 },
      { id: 'studentSession', label: 'Student session', type: 'text', placeholder: 'e.g. 2021-22', max: 20 },
      { id: 'group', label: 'Group (optional)', type: 'text', max: 20 }
    ]},
    { group: 'Teacher', fields: [
      { id: 'submittedTo', label: 'Submitted to', type: 'text', placeholder: 'Teacher name', max: 80, wide: true },
      { id: 'designation', label: 'Designation', type: 'text', placeholder: 'e.g. Associate Professor', max: 80, wide: true },
      { id: 'teacherDept', label: 'Teacher department', type: 'text', max: 80, wide: true },
      { id: 'teacherInst', label: 'Teacher institution', type: 'text', max: 100, wide: true }
    ]},
    { group: 'Submission', fields: [
      { id: 'collegeName', label: 'College name', type: 'text', max: 100, wide: true },
      { id: 'affiliation', label: 'Affiliation', type: 'text', max: 100, wide: true },
      { id: 'extra', label: 'Additional information (optional)', type: 'textarea', max: 220, wide: true }
    ]}
  ];

  /* Everything the "Save profile" action stores. */
  const PROFILE_KEYS = ['studentName', 'roll', 'reg', 'dept', 'program', 'year', 'semester', 'studentSession', 'group'];

  const DEFAULT_STATE = {
    template: 'classic',
    docType: 'Assignment',
    customDocType: '',
    title: 'Assignment on Biostatistics',
    subject: 'Botany',
    subjectCode: '',
    courseName: 'Biostatistics & Research Methodology',
    courseCode: '243013',
    expNo: '',
    expTitle: '',
    expDate: '',
    place: '',
    fieldDate: '',
    session: '2021-22',
    submissionDate: '',
    studentName: 'Hasan Shuvro',
    roll: '',
    reg: '',
    dept: 'Department of Botany',
    program: '',
    year: '',
    semester: '',
    studentSession: '2021-22',
    group: '',
    submittedTo: 'Dr. Md. Anwarul Islam',
    designation: 'Associate Professor (Botany)',
    teacherDept: '',
    teacherInst: 'Bhawal Badre Alam Govt. College, Gazipur',
    collegeName: INSTITUTION.name,
    affiliation: INSTITUTION.affiliation,
    extra: '',
    members: [
      { name: 'Hasan Shuvro', roll: '', section: '', role: 'Leader' },
      { name: '', roll: '', section: '', role: 'Member' },
      { name: '', roll: '', section: '', role: 'Member' }
    ],
    design: {
      preset: 'navy', primary: '#14284b', secondary: '#b08d3c',
      font: 'baskerville', headFont: 'same', fontSize: 100,
      border: 'single', borderWidth: 2,
      showNU: true, showCollege: true, logoSize: 24, logoPlacement: 'center',
      orientation: 'portrait', pageSize: 'a4', customW: 210, customH: 297,
      watermark: '', signatures: false, blankLines: false
    },
    logos: { nu: '', college: '' }
  };

  window.CPD = { INSTITUTION, CREDIT, COUNTER, DOC_TYPES, TEMPLATES, COLOR_PRESETS, FONTS, BORDERS, PAGE_SIZES, FIELDS, PROFILE_KEYS, DEFAULT_STATE, PRACTICAL, OUTING };
})();
