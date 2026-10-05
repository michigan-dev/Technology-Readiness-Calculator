/*
 * All content for the Lab-to-Market Readiness Scorer lives here as data:
 * sectors, questionnaire groups, official level definitions, milestone text
 * and summary templates. UI and scoring code read from this object only.
 *
 * Loads in the browser as window.READINESS_DATA and in Node via require().
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.READINESS_DATA = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const sectors = [
    { id: "energy", label: "Energy", phrase: "energy" },
    { id: "materials", label: "Advanced Materials", phrase: "advanced-materials" },
    { id: "manufacturing", label: "Advanced Manufacturing", phrase: "advanced-manufacturing" },
    { id: "quantum", label: "Quantum", phrase: "quantum" },
    { id: "other", label: "Other", phrase: "deep-tech" },
  ];

  /* ---------- Questionnaire ---------- */
  /* `level` is the TRL/MRL a "Yes" confirms. Levels must be confirmed in order. */
  const groups = [
    {
      id: "trl-foundations",
      dimension: "trl",
      title: "Technology readiness: foundations",
      intro:
        "Start with the science. Answer Yes only if you have evidence you could show a technical reviewer.",
      questions: [
        { id: "trl1", level: 1, text: "Basic scientific principles have been observed and reported.", help: "For example a peer-reviewed paper, lab notebook results or an invention disclosure." },
        { id: "trl2", level: 2, text: "A specific technology concept and its intended application are formulated.", help: "You can describe what the product does and for whom, even if it is not yet proven." },
        { id: "trl3", level: 3, text: "Proof of concept is shown: analytical and experimental evidence that the critical function works.", help: "Bench experiments or models show the core effect, not yet as an integrated device." },
        { id: "trl4", level: 4, text: "Components or a breadboard are validated together in a laboratory environment.", help: "Pieces work together on the bench under controlled lab conditions." },
      ],
    },
    {
      id: "trl-demonstration",
      dimension: "trl",
      title: "Technology readiness: demonstration",
      intro:
        "Now the harder part: testing outside controlled conditions. Real-world conditions are where most lab technologies stall.",
      questions: [
        { id: "trl5", level: 5, text: "Components or a breadboard are validated in a relevant environment.", help: "Tested under conditions that closely mimic real use: temperature, scale, contaminants, duty cycle." },
        { id: "trl6", level: 6, text: "A system or subsystem prototype has been demonstrated in a relevant environment.", help: "A representative prototype, not just parts, performs end to end." },
        { id: "trl7", level: 7, text: "A system prototype has been demonstrated in an operational environment.", help: "Running at a customer, test site or field location under real operating conditions." },
        { id: "trl8", level: 8, text: "The actual system is complete and qualified through test and demonstration.", help: "Final form, passed required certifications or qualification testing." },
        { id: "trl9", level: 9, text: "The actual system is proven through successful operation.", help: "In commercial or mission service, with a track record of performance." },
      ],
    },
    {
      id: "mrl-process",
      dimension: "mrl",
      title: "Manufacturing readiness: materials and process",
      intro:
        "Can you make it, and make it again? Manufacturing readiness is where lab technologies most often lag.",
      questions: [
        { id: "mrl2", level: 2, text: "Manufacturing concepts are identified: you know the likely materials, process routes and critical steps.", help: "A written outline of how the product could be built at scale." },
        { id: "mrl3", level: 3, text: "Key materials are sourced and a manufacturing proof of concept has been built.", help: "Real suppliers or feedstocks identified, and you have made a sample using them." },
        { id: "mrl4", level: 4, text: "The process is defined and you can produce the technology in a laboratory environment.", help: "Documented steps, repeatable results in lab batches." },
        { id: "mrl5", level: 5, text: "Prototype components can be produced in a production-relevant environment.", help: "For example at a pilot facility, shared user facility or contract manufacturer." },
      ],
    },
    {
      id: "mrl-scale",
      dimension: "mrl",
      title: "Manufacturing readiness: scale-up",
      intro: "From prototype builds to a production line.",
      questions: [
        { id: "mrl6", level: 6, text: "A prototype system or subsystem has been produced in a production-relevant environment, and critical processes are prototyped.", help: "You know which steps drive yield and cost." },
        { id: "mrl7", level: 7, text: "Systems or components can be produced in a production-representative environment.", help: "Yield, cycle time and cost data come from near-production equipment." },
        { id: "mrl8", level: 8, text: "A pilot line is demonstrated and you are ready to begin low-rate production.", help: "Pilot line running with quality controls and a supplier base." },
        { id: "mrl9", level: 9, text: "Low-rate production is demonstrated and the capability is in place for full-rate production.", help: "Products are being built and sold in small volumes." },
        { id: "mrl10", level: 10, text: "Full-rate production is demonstrated with lean production practices in place.", help: "Stable high-volume output with continuous improvement." },
      ],
    },
    {
      id: "business",
      dimension: "biz",
      title: "Business readiness",
      intro:
        "Five quick checks on commercial traction. These do not change your TRL or MRL but shape your next steps.",
      questions: [
        { id: "biz-discovery", text: "We have completed customer discovery interviews (roughly a dozen or more) with potential buyers or users.", help: "Structured conversations about their problem, not product pitches.", label: "customer discovery interviews completed", milestone: "Run 10 to 15 structured customer discovery interviews with the buyers and users who would pay for this, and write up the top problem you hear." },
        { id: "biz-pilot", text: "A named pilot customer or design partner has agreed to evaluate the technology.", help: "A real organization with a contact, not a generic letter of interest.", label: "a named pilot customer", milestone: "Secure a named pilot customer or design partner with a written evaluation scope, success criteria and timeline." },
        { id: "biz-ip", text: "Patent applications or invention disclosures are filed, with a clear license or ownership path.", help: "Including any license agreement with the lab or university.", label: "IP filed", milestone: "File provisional patent applications on the core invention and agree a license or ownership path with the lab or university technology transfer office." },
        { id: "biz-lead", text: "The team includes a commercial lead with market experience.", help: "A CEO, founder-in-residence or senior advisor who has sold into this market.", label: "a commercial lead on the team", milestone: "Recruit a commercial lead (CEO or founder-in-residence) who has sold into your target market, so the technical founders can stay focused on the technology." },
        { id: "biz-funding", text: "Funding has been raised to reach the next milestone.", help: "Equity, grants (SBIR/STTR, ARPA-E, DOE) or customer-funded work.", label: "funding raised", milestone: "Raise or win non-dilutive funding (for example SBIR/STTR, DOE or ARPA-E, or a lab Technology Commercialization Fund award) sized to reach your next technical milestone." },
      ],
    },
  ];

  /* ---------- Official level definitions ---------- */
  const scales = {
    trl: {
      name: "Technology Readiness Level",
      abbr: "TRL",
      min: 1,
      max: 9,
      source: "NASA / DOE",
      about: [
        "Technology Readiness Levels measure how mature a technology is on a 1 to 9 scale, from basic scientific observation to proven operation. NASA created the scale and the U.S. Department of Energy uses an adapted version for its programs.",
        "Investors and funders use TRL to judge technical risk. Most lab-origin technologies start at TRL 1 to 4; the gap between TRL 4 and 7 is where much funding is needed and where many projects stall.",
      ],
      levels: [
        { level: 1, title: "Basic principles observed", definition: "Basic principles observed and reported.", plain: "Scientific research begins; findings are written up." },
        { level: 2, title: "Concept formulated", definition: "Technology concept and/or application formulated.", plain: "Practical applications are proposed, still speculative." },
        { level: 3, title: "Proof of concept", definition: "Analytical and experimental critical function and/or characteristic proof of concept.", plain: "Lab studies show the core idea works." },
        { level: 4, title: "Lab validation", definition: "Component and/or breadboard validation in a laboratory environment.", plain: "Basic components work together in the lab." },
        { level: 5, title: "Relevant-environment validation", definition: "Component and/or breadboard validation in a relevant environment.", plain: "Components are tested under realistic conditions." },
        { level: 6, title: "Prototype in relevant environment", definition: "System/subsystem model or prototype demonstration in a relevant environment.", plain: "A representative prototype works under realistic conditions." },
        { level: 7, title: "Prototype in operational environment", definition: "System prototype demonstration in an operational environment.", plain: "A near-final prototype runs in the field." },
        { level: 8, title: "System qualified", definition: "Actual system completed and qualified through test and demonstration.", plain: "The final system passes qualification." },
        { level: 9, title: "Proven in operation", definition: "Actual system proven through successful mission operations.", plain: "The system is in successful commercial or mission service." },
      ],
    },
    mrl: {
      name: "Manufacturing Readiness Level",
      abbr: "MRL",
      min: 1,
      max: 10,
      source: "U.S. DoD",
      about: [
        "Manufacturing Readiness Levels measure how ready a technology is to be produced at scale and at a target cost, on a 1 to 10 scale. They were developed by the U.S. Department of Defense and are widely used in advanced manufacturing programs.",
        "MRL usually trails TRL for lab technologies. A product that works once is not the same as one that can be made repeatably, and investors increasingly ask for both numbers.",
      ],
      levels: [
        { level: 1, title: "Implications identified", definition: "Basic manufacturing implications identified.", plain: "Early thinking on what manufacturing might require." },
        { level: 2, title: "Concepts identified", definition: "Manufacturing concepts identified.", plain: "Candidate processes and materials are outlined." },
        { level: 3, title: "Manufacturing proof of concept", definition: "Manufacturing proof of concept developed.", plain: "Key materials sourced; a sample made with them." },
        { level: 4, title: "Lab production", definition: "Capability to produce the technology in a laboratory environment.", plain: "A defined process produces lab-scale output." },
        { level: 5, title: "Prototype components, production-relevant", definition: "Capability to produce prototype components in a production-relevant environment.", plain: "Components made outside the lab, e.g. at a pilot facility." },
        { level: 6, title: "Prototype system, production-relevant", definition: "Capability to produce a prototype system or subsystem in a production-relevant environment.", plain: "Whole prototypes made; critical processes understood." },
        { level: 7, title: "Production-representative", definition: "Capability to produce systems, subsystems or components in a production-representative environment.", plain: "Near-production equipment yields real cost and yield data." },
        { level: 8, title: "Pilot line", definition: "Pilot line capability demonstrated; ready to begin low-rate production.", plain: "A pilot line runs with quality controls." },
        { level: 9, title: "Low-rate production", definition: "Low-rate production demonstrated; capability in place to begin full-rate production.", plain: "Small-volume production is under way." },
        { level: 10, title: "Full-rate production", definition: "Full-rate production demonstrated and lean production practices in place.", plain: "Stable high-volume production." },
      ],
    },
  };

  /* ---------- Milestones ---------- */
  /* Technology milestones by TRL band, then sector. Two per sector, highest priority first. */
  const techBands = [
    {
      id: "early", max: 3, headline: "Prove the technology works in the lab",
      generic: [
        "Define the two or three performance specifications a customer would need, and design experiments that test them with pass/fail criteria.",
        "Document results in a form a technical reviewer could repeat: protocols, raw data and an uncertainty estimate.",
      ],
      sector: {
        energy: [
          "Build a bench-scale prototype and measure efficiency, capacity or cost per kWh against the incumbent technology.",
          "Run a techno-economic model with a national lab or university partner to show the path to cost parity.",
        ],
        materials: [
          "Characterize your material against the incumbent on the three properties customers care about, using independent testing where possible.",
          "Make a batch large enough to supply test coupons to two or three prospective end users.",
        ],
        manufacturing: [
          "Demonstrate the core process on a bench-top rig and record cycle time, tolerance and defect rate.",
          "Compare the process economics to the incumbent method with a simple per-part cost model.",
        ],
        quantum: [
          "Demonstrate the core device or protocol with measured coherence time, fidelity or error rates against published benchmarks.",
          "Identify which part of the quantum stack (device, control, software or materials) you will sell and who buys it.",
        ],
        other: [
          "Build a bench-scale demonstration of the critical function and measure it against a clearly stated target.",
          "Write a one-page technical brief with the key performance claim and the evidence behind it.",
        ],
      },
    },
    {
      id: "lab", max: 5, headline: "Build a relevant-environment prototype",
      generic: [
        "Define what a \"relevant environment\" means for your first customer (conditions, scale, duty cycle) and write the test plan against it.",
        "Integrate your components into a working prototype and run it continuously long enough to expose failure modes.",
      ],
      sector: {
        energy: [
          "Build a relevant-environment prototype and test it under realistic load, temperature and duty cycle.",
          "Line up a utility or national lab test site for field or user-facility testing.",
        ],
        materials: [
          "Test the material under real service conditions (temperature, stress, chemistry, aging) rather than lab conditions.",
          "Get a prospective customer or independent lab to validate performance data on material you produced.",
        ],
        manufacturing: [
          "Install the process on production-like equipment and run it on real customer parts or materials.",
          "Line up a manufacturing test bed, such as a Manufacturing USA institute or a shared pilot facility.",
        ],
        quantum: [
          "Operate the system under realistic noise, temperature and uptime conditions rather than ideal lab setups.",
          "Pair with a national lab, cloud provider or end user to run real workloads on your hardware or software.",
        ],
        other: [
          "Build an integrated prototype and test it under conditions that mimic your target customer's environment.",
          "Identify a test site or partner who can host relevant-environment testing.",
        ],
      },
    },
    {
      id: "demo", max: 7, headline: "Demonstrate in the field and prepare to qualify",
      generic: [
        "Define qualification criteria with your first customer: standards, certifications and acceptance tests.",
        "Run an extended operational demonstration and publish the performance, reliability and safety results.",
      ],
      sector: {
        energy: [
          "Run a field pilot with a utility or project developer and capture bankable performance data.",
          "Begin the certification and safety testing (for example UL or IEEE standards) your first buyer will require.",
        ],
        materials: [
          "Complete qualification testing against the customer's material specification and get it listed as an approved material.",
          "Secure a supply agreement for a first commercial volume with a named customer.",
        ],
        manufacturing: [
          "Deploy the system on a customer's factory floor for a production trial and record throughput and yield.",
          "Document safety, maintenance and training procedures so the system can be operated without your team.",
        ],
        quantum: [
          "Deliver the system to a customer or partner site for sustained operation, with uptime and error-rate reporting.",
          "Agree a commercial pilot with a customer for a defined use case and success metrics.",
        ],
        other: [
          "Run an operational pilot with a paying or committed customer and capture performance data.",
          "Complete the qualification or certification your first customer requires.",
        ],
      },
    },
    {
      id: "deploy", max: 9, headline: "Scale deployment and commercial operations",
      generic: [
        "Convert pilot results into repeatable commercial contracts with standard terms and pricing.",
        "Build the service, support and warranty capability needed to run at customer scale.",
      ],
      sector: {
        energy: [
          "Move from pilot to the first commercial-scale deployment backed by financing and performance guarantees.",
          "Build a track record of operating data that lenders and insurers will accept.",
        ],
        materials: [
          "Secure multi-year supply agreements and qualify second-source feedstocks to reduce supply risk.",
          "Publish customer case studies with in-service data to pull adoption through specifiers.",
        ],
        manufacturing: [
          "Expand from pilot installs to a repeatable sales and installation process across multiple customer sites.",
          "Build a service and spare-parts model so customers can run the system at full production rate.",
        ],
        quantum: [
          "Convert pilots into recurring contracts and build the service layer needed to operate systems in the field.",
          "Standardize the product and publish benchmarks that let customers compare you with alternatives.",
        ],
        other: [
          "Convert pilots into commercial contracts and build the support organization to serve them.",
          "Collect operating data and case studies to support scale-up.",
        ],
      },
    },
  ];

  /* Manufacturing milestones by MRL band, then sector. One per sector plus one generic. */
  const mfgBands = [
    {
      id: "early", max: 3, headline: "Define how the technology will be made",
      generic: "Write a manufacturing concept: the main process steps, the materials and equipment needed, and the biggest unknowns.",
      sector: {
        energy: "Identify your key materials, cells or components and where they will come from, and flag any supply constraints early.",
        materials: "Define the synthesis or processing route and test whether it scales beyond gram quantities.",
        manufacturing: "Map the process flow and identify the two or three steps that will drive yield and cost.",
        quantum: "Identify the fabrication route (foundry, cleanroom or custom build) and the tolerances your device needs.",
        other: "Map the manufacturing route and list the critical materials, steps and suppliers.",
      },
    },
    {
      id: "lab", max: 5, headline: "Make it repeatably, outside the lab",
      generic: "Document the process and make prototypes in a production-relevant setting, not just the lab.",
      sector: {
        energy: "Build prototype units at a pilot or shared facility, and track yield and cost per unit.",
        materials: "Scale a batch to kilogram scale at a pilot facility and show consistent properties from batch to batch.",
        manufacturing: "Move the process onto production-grade equipment at a shared user facility or contract manufacturer.",
        quantum: "Fabricate a batch of devices at a commercial or shared foundry and measure yield and variation.",
        other: "Make a repeatable batch at a pilot facility or contract manufacturer and measure variation.",
      },
    },
    {
      id: "pilot", max: 7, headline: "Demonstrate a pilot line",
      generic: "Stand up a pilot line (your own or a partner's) and use it to establish yield, cycle time and unit cost.",
      sector: {
        energy: "Engage a contract manufacturer and run a pilot line to produce enough units for field pilots and certification.",
        materials: "Run a pilot line with real feedstocks, set specifications and quality control, and track cost per kilogram.",
        manufacturing: "Define a bill of materials, tooling and supplier list, and run a pilot build with quality controls.",
        quantum: "Establish a repeatable build and test flow so each device is characterized the same way before delivery.",
        other: "Run a pilot build with defined quality controls and a bill of materials with named suppliers.",
      },
    },
    {
      id: "scale", max: 10, headline: "Scale to production",
      generic: "Prove low-rate production, then build the supply chain and quality system for full-rate production.",
      sector: {
        energy: "Qualify a second supplier for critical components and lock in unit cost targets for volume production.",
        materials: "Secure feedstock supply and capacity for full-rate production, with statistical process control in place.",
        manufacturing: "Apply lean practices and statistical process control and set a cost-down roadmap for volume.",
        quantum: "Move from lab-style builds to a production line with test automation and defined yield targets.",
        other: "Lock supplier agreements and quality systems for full-rate production.",
      },
    },
  ];

  /* ---------- Gap messages ---------- */
  const gapMessages = {
    trl: "Technology readiness is your biggest gap. At TRL {trl}, the core technical risk is still open, and funders will want evidence before backing commercial steps.",
    mrl: "Manufacturing readiness is your biggest gap. At MRL {mrl} against TRL {trl}, the technology is ahead of your ability to make it. This is the most common gap for lab spin-outs.",
    biz: "Business readiness is your biggest gap. With {biz} of {bizTotal} commercial markers in place, the technology is ahead of the commercial case that investors will want to see.",
    balanced: "Your three dimensions are well balanced, so no single area is holding you back. Keep them moving together; the next milestones below advance each one.",
  };

  const dimensionLabels = { trl: "Technology readiness", mrl: "Manufacturing readiness", biz: "Business readiness" };

  /* ---------- Summary templates ---------- */
  const summary = {
    main: "{name} is {sector} technology at TRL {trl} ({trlDef}) and MRL {mrl} ({mrlDef}).",
    business: {
      none: "No commercial markers are in place yet.",
      some: "On the commercial side, it has {have}.",
      all: "All five commercial markers are in place: {have}.",
    },
    gap: "The largest gap is {gapLabel}.",
    gapBalanced: "Readiness is well balanced across technology, manufacturing and business.",
    next: "Next milestones: {next}",
    disclaimer: "Self-assessed using the TRL (NASA/DOE) and MRL (DoD) scales; not an official certification.",
  };

  return { sectors, groups, scales, techBands, mfgBands, gapMessages, dimensionLabels, summary };
});
