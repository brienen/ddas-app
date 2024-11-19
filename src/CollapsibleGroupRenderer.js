import React, { useState, useCallback } from 'react';
import { JsonForms, withJsonFormsLayoutProps } from '@jsonforms/react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CollapsibleGroupRenderer = React.memo(({ uischema, schema, path, renderers }) => {

  const [expanded, setExpanded] = useState(false);

  const handleChange = useCallback(() => {
    setExpanded((prevExpanded) => !prevExpanded);
  }, []);
  console.log('UISchema: ', uischema);
  console.log('Schema: ', schema);
  console.log('Defs: ', schema.$defs);
  console.log('Path: ', path);
  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{uischema.label || 'Groep'}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {uischema.elements.map((element, index) => (
          <JsonForms
            key={index}
            schema={{
              ...schema,
              $defs: schema.$defs || {}
            }}
            uischema={element}
            path={path}
            renderers={renderers} // Combineer standaard en custom renderers
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
});

export default withJsonFormsLayoutProps(CollapsibleGroupRenderer);
