import { clinicalBoundaries } from "@cadence-clinical/config/eslint/boundaries";
import { componentStyling } from "@cadence-clinical/config/eslint/components";
import react from "@cadence-clinical/config/eslint/react";

export default [...react, ...clinicalBoundaries, ...componentStyling];
