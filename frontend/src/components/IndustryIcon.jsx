import React from "react";
import {
  CodeBracketIcon,
  SparklesIcon,
  PaintBrushIcon,
  BuildingLibraryIcon,
  MegaphoneIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  CogIcon,
  UserGroupIcon,
  ScaleIcon,
  BoltIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/solid";

const iconMap = {
  "ind-001": CodeBracketIcon, // Software Engineering
  "ind-002": SparklesIcon, // Data Science
  "ind-003": PaintBrushIcon, // Product Design
  "ind-004": BuildingLibraryIcon, // Finance
  "ind-005": MegaphoneIcon, // Sales & Marketing
  "ind-006": CheckCircleIcon, // Healthcare
  "ind-007": AcademicCapIcon, // Education
  "ind-008": CogIcon, // Operations
  "ind-009": UserGroupIcon, // HR
  "ind-010": ScaleIcon, // Legal
  "ind-011": BoltIcon, // DevOps
  "ind-012": BriefcaseIcon, // Consulting
};

function IndustryIcon({ industryId, className = "w-8 h-8" }) {
  const IconComponent = iconMap[industryId];

  if (!IconComponent) {
    return <div className={className}>?</div>;
  }

  return (
    <IconComponent
      className={className}
      style={{ color: "#2563eb" }}
    />
  );
}

export default IndustryIcon;
