import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Paper,
} from '@mui/material';
import { useState } from 'react';

const CATEGORIEEN = [
  'Lopend traject, beëindigd',
  'Nieuw traject, beëindigd',
  'Lopend traject, nog actief',
  'Nieuw traject, nog actief',
  'Buiten rapportageperiode',
  'Onbekend'
];

const TrajectOverzicht = ({ trajecten, formAlgemeen }) => {

  const formatDatum = (d) =>
    d ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : 'onbekend';

  const [sortKey, setSortKey] = useState('gemeentecode'); // sorteerkolom (kan ook 'totaal', of een categorie uit de array CATEGORIEEN)
  const [sortDirection, setSortDirection] = useState('asc'); // sorteerrichting asc om te beginnen

  const handleSort = (key) => {
    if (sortKey === key) {
      // Zelfde kolom → draai sorteer richting om
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Andere kolom - hou sorteerrichting hetzelfde
      setSortKey(key);
      // setSortDirection('asc');
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

    let categorie = CATEGORIEEN[5];
    if (start) {
      const startVoor = start < startLevering;
      const startNa = start >= startLevering;
      const startTelaat = start && start > eindLevering;
      const eindVoor = eind && eind <= eindLevering;
      const eindNaOfGeen = !eind || eind > eindLevering;
      const eindTevroeg = eind && eind < startLevering;

      if (startTelaat || eindTevroeg) categorie = CATEGORIEEN[4];
      else if (startVoor && eindVoor) categorie = CATEGORIEEN[0];
      else if (startNa && eindVoor) categorie = CATEGORIEEN[1];
      else if (startVoor && eindNaOfGeen) categorie = CATEGORIEEN[2];
      else if (startNa && eindNaOfGeen) categorie = CATEGORIEEN[3];
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
  if (sortedCodes.length === 0) {
    console.log('sortCodes = 0');
    return <p>Er zijn nog geen schuldhulptrajecten ingevoerd.</p>;
  }

  return (

    <div>
    <p>Samenvatting van de ingevoerde gegevens:</p>
    <p style={{ fontSize: '0.9em' }}>Rapportageperiode: {formatDatum(startLevering)} - {formatDatum(eindLevering)}</p>

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
      LET OP: dit zijn de totalen van de ingevoerde gegevens. Na indienen bij het CBS wordt een "op orde" rapport gegenereerd met een meer gedetailleerde terugkoppeling. Op basis van dat rapport kunt u besluiten om de gegevens alsnog in te trekken voordat deze verwerkt worden.
    </div>

    </div>
  );
};

export default TrajectOverzicht;
