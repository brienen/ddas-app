import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Paper,
} from '@mui/material';
import { useState } from 'react';

const CATEGORIEEN = [
  'Traject liep al, nu beëindigd',
  'Traject liep al, loopt nog',
  'Traject gestart en beëindigd',
  'Traject gestart, loopt nog',
  'Buiten rapportageperiode',
  'Onbekend'
];

const TrajectOverzicht = ({ trajecten, formAlgemeen }) => {

  const [sortKey, setSortKey] = useState('gemeentecode'); // of 'totaal', of een categorie
  const [sortDirection, setSortDirection] = useState('desc');

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      // Zelfde kolom → draai sorteer richting om
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Andere kolom → start met oplopend
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (
    !Array.isArray(trajecten) ||
    trajecten.length === 0 ||
    !formAlgemeen.startdatumLevering ||
    !formAlgemeen.einddatumLevering
  ) {
    return <p>Er zijn nog geen schuldhulptrajecten ingevoerd.</p>;
  }

  const parseDate = (str) => (str ? new Date(str) : null);

  const startLevering = parseDate(formAlgemeen.startdatumLevering);
  const eindLevering = parseDate(formAlgemeen.einddatumLevering);

  const overzicht = {};

  const geldigeTrajecten = trajecten.filter(
    (t) => t && typeof t === 'object' && 'gemeentecode' in t
  );

  geldigeTrajecten.forEach((traject) => {
    const code = traject.gemeentecode || 'onbekend';
    const start = parseDate(traject.startdatum);
    const eind = parseDate(traject.einddatum);

    let categorie = 'Onbekend';

    if (start) {
      const startVoor = start < startLevering;
      const startNa = start >= startLevering;
      const startTelaat = start && start > eindLevering;
      const eindVoor = eind && eind < eindLevering;
      const eindNaOfGeen = !eind || eind >= eindLevering;
      const eindTevroeg = eind && eind < startLevering;

      if (startTelaat || eindTevroeg) categorie = CATEGORIEEN[4];
      else if (startVoor && eindVoor) categorie = CATEGORIEEN[0];
      else if (startVoor && eindNaOfGeen) categorie = CATEGORIEEN[1];
      else if (startNa && eindVoor) categorie = CATEGORIEEN[2];
      else if (startNa && eindNaOfGeen) categorie = CATEGORIEEN[3];
      else categorie =  CATEGORIEEN[5];
    }

    if (!overzicht[code]) {
      overzicht[code] = Object.fromEntries(CATEGORIEEN.map((c) => [c, 0]));
    }

    overzicht[code][categorie]++;
  });

  const totalTrajectenPerCode = (telling) =>
    CATEGORIEEN.reduce((sum, cat) => sum + (telling[cat] || 0), 0);

  const sortedCodes = Object.keys(overzicht).sort((a, b) => {
    const aValue =
      sortKey === 'gemeentecode'
        ? a
        : sortKey === 'totaal'
          ? totalTrajectenPerCode(overzicht[a])
          : overzicht[a][sortKey];

    const bValue =
      sortKey === 'gemeentecode'
        ? b
        : sortKey === 'totaal'
          ? totalTrajectenPerCode(overzicht[b])
          : overzicht[b][sortKey];

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
  });
  if (sortedCodes.length == 0) {
    console.log('sortCodes = 0');
    return <p>Er zijn nog geen schuldhulptrajecten ingevoerd.</p>;
  }

  return (

    <div>
    <p>Samenvatting van de ingevoerde gegevens:</p>

    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sortKey === 'gemeentecode'}
                direction={sortDirection}
                onClick={() => handleSort('gemeentecode')}
              >
                Gemeentecode
              </TableSortLabel>
            </TableCell>

            {CATEGORIEEN.map((cat) => (
              <TableCell key={cat} align="center">
                <TableSortLabel
                  active={sortKey === cat}
                  direction={sortDirection}
                  onClick={() => handleSort(cat)}
                >
                  {cat}
                </TableSortLabel>
              </TableCell>
            ))}

            <TableCell align="center">
              <TableSortLabel
                active={sortKey === 'totaal'}
                direction={sortDirection}
                onClick={() => handleSort('totaal')}
              >
                Totaal
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCodes.map((code) => {
            const telling = overzicht[code];
            const totaal = totalTrajectenPerCode(telling);
            return (
              <TableRow key={code}>
                <TableCell>{code}</TableCell>
                {CATEGORIEEN.map((cat) => (
                  <TableCell key={cat} align="center">{telling[cat]}</TableCell>
                ))}
                <TableCell align="center">{totaal}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <div>
      <br />
      Verder afstemmen op "op orde" bericht CBS!
    </div>

    </div>
  );
};

// Optionele simpele styling
const cellStyle = {
  border: '1px solid #ccc',
  padding: '6px 10px',
  textAlign: 'center',
};

export default TrajectOverzicht;
