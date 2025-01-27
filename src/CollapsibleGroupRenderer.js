import React, { useState, useCallback } from 'react';
import { JsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CollapsibleGroupRenderer = ({ uischema, schema, path, renderers, data, onChange, handleChange }) => {
  console.log('Props in CollapsibleGroupRenderer:', { uischema, schema, data, path, renderers, onChange, handleChange });

  const [expanded, setExpanded] = useState(false);

  const handleAccordionChange = useCallback(() => {
    setExpanded((prevExpanded) => !prevExpanded);
  }, []);

  return (
    <Accordion expanded={expanded} onChange={handleAccordionChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{uischema.label || 'Groep'}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {uischema.elements.map((element, index) => (
          <JsonForms
            key={index}
            schema={{
              ...schema,
              $defs: schema.$defs, // Zorg dat gedeelde definities beschikbaar zijn
            }}
            uischema={element}
            path={path}
            renderers={renderers}
            data={data}
            onChange={({ data: updatedData }) => {
              if (onChange) {
                onChange(updatedData);
              } else if (handleChange) {
                console.warn('onChange is niet gedefinieerd.');
                handleChange(path, updatedData);
              } else {
                console.warn('handleChange is niet gedefinieerd');
              }
            }}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default withJsonFormsLayoutProps(CollapsibleGroupRenderer);
