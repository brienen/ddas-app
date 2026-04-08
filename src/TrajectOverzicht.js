import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Paper, Dialog,
  DialogTitle, DialogContent, List, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import { Typography } from '@mui/material';
import './MainForm.css';

const CATEGORIEEN = [
  'Lopend traject, beëindigd',
  'Nieuw traject, beëindigd',
  'Lopend traject, nog actief',
  'Nieuw traject, nog actief',
  'Buiten rapportageperiode',
  'Onbekend'
];

const processtappen = [
  "aanmelding",
  "intake",
  "planVanAanpak",
  "stabilisatie",
  "oplossing",
  "schuldregeling",
  "nazorg",
  "uitstroom",
  "onbekend"
];

  const TrajectOverzicht = ({ trajecten, formAlgemeen, setCurrentTrajectIndex, setActiveTab }) => {

  const formatDatum = (d) =>
    d ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : 'onbekend';

  const [sortKey, setSortKey] = useState('gemeentecode');
  const [sortDirection, setSortDirection] = useState('asc');

  const [selectedTrajectList, setSelectedTrajectList] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
    }
  };

  const parseDate = (str) => (str ? new Date(str) : null);

  if (
    !Array.isArray(trajecten) ||
    trajecten.length === 0 ||
    !formAlgemeen.startdatumLevering ||
    !formAlgemeen.einddatumLevering
  ) {
    return <p>Er zijn nog geen schuldhulptrajecten ingevoerd.</p>;
  }

  const startLevering = parseDate(formAlgemeen.startdatumLevering);
  const eindLevering = parseDate(formAlgemeen.einddatumLevering);

  const overzicht = {};
  const trajectIndexPerCodeCat = {};

  trajecten.forEach((traject, index) => {
    const code = traject?.gemeentecode || 'onbekend';
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
      trajectIndexPerCodeCat[code] = Object.fromEntries(CATEGORIEEN.map((c) => [c, []]));
    }

    overzicht[code][categorie]++;
    trajectIndexPerCodeCat[code][categorie].push(index);

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

  const trajectenPerGemeente = {};
  trajecten.forEach((traject) => {
    const code = traject.gemeentecode || "onbekend";
    if (!trajectenPerGemeente[code]) {
      trajectenPerGemeente[code] = [];
    }
    trajectenPerGemeente[code].push(traject);
  });

// Bepaal laatste stap van een traject
  const bepaalLaatsteStap = (traject) => {
    let laatsteStap = null;
    let laatsteStart = null;

    processtappen.forEach((stap) => {
      if (stap === "onbekend") return;

      let stapData = traject[stap];
      if (!stapData) return;

      if (Array.isArray(stapData)) {
        stapData = stapData[stapData.length - 1];
      }

      const startDatum =
        stapData.startdatum ??
        stapData.datumAfronding ??
        stapData.datum;

      if (!startDatum) return;

      const start = new Date(startDatum);
      const eind = stapData.einddatum ? new Date(stapData.einddatum) : null;

      if (start > eindLevering) return;
      // als een stap al is afgerond voor de rapportageperiode, wordt die genegeerd - uitgecommentarieerd omdat het op-orde rapport dit niet doet!
      // if ((eind && eind < startLevering) || (stap === "uitstroom" && start < startLevering)) return;

      if (!laatsteStart || start >= laatsteStart) {
        laatsteStart = start;
        laatsteStap = stap;
      }
    });

    return laatsteStap ?? "onbekend";
  };

  const tellingPerGemeenteEnStap = {};
  Object.entries(trajectenPerGemeente).forEach(([gemeente, lijst]) => {
    const telling = {};

    processtappen.forEach((stap) => {
      telling[stap] = 0;
    });

    lijst.forEach((traject) => {
      const laatsteStap = bepaalLaatsteStap(traject);

      if (laatsteStap) {
        telling[laatsteStap]++;
      }
    });

    tellingPerGemeenteEnStap[gemeente] = telling;
  });

  const processtapTellingen = {};

  processtappen.forEach((stap) => {
    processtapTellingen[stap] = trajecten.filter((traject) => {
      return bepaalLaatsteStap(traject) === stap;
    }).length;
  });

  const stapLabel = (naam) =>
    naam.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (s) => s.toUpperCase());

  const openTrajectenDialog = (titel, trajectenLijst) => {
    setDialogTitle(titel);
    setSelectedTrajectList(trajectenLijst);
    setDialogOpen(true);
  };

  return (
    <div>
      <p style={{ fontSize: '0.9em' }}>
        Rapportageperiode: {formatDatum(startLevering)} - {formatDatum(eindLevering)}
      </p>

      <Typography variant="h8" style={{ marginTop: "1em" }}>
        Overzicht aantal trajecten per gemeentecode en status van het traject
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
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
                    <TableCell
                      key={cat}
                      align="center"
                      {...(telling[cat] > 0 && {
                        onClick: () => {
                          const indicesVoorCategorie = trajectIndexPerCodeCat[code]?.[cat] || [];
//                          const trajectenVoorCategorie = indicesVoorCategorie.map(
//                            (i) => trajecten[i]
//                          );
                          const trajectenVoorCategorie = indicesVoorCategorie.map((i) => ({
                            traject: trajecten[i],
                            originalIndex: i
                          }));
                          openTrajectenDialog(
                            `Trajecten voor categorie "${cat}" (gemeente ${code}) (klik op traject om daarheen te gaan)`,
                            trajectenVoorCategorie
                          );
                        },
                        title: "Klik om de bijbehorende trajecten te bekijken",
                        style: {
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline"
                        }
                      })}
                    >
                      {telling[cat]}
                    </TableCell>
                  ))}
                  <TableCell align="center">{totaal}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell><strong>Totaal</strong></TableCell>
              {CATEGORIEEN.map((cat) => {
                const totaalPerCategorie = Object.values(overzicht).reduce(
                  (sum, telling) => sum + (telling[cat] || 0),
                  0
                );
                return (
                  <TableCell key={cat} align="center">
                    {totaalPerCategorie}
                  </TableCell>
                );
              })}
              <TableCell align="center">
                {Object.values(overzicht).reduce(
                  (sum, telling) =>
                    sum + CATEGORIEEN.reduce((catSum, cat) => catSum + (telling[cat] || 0), 0),
                  0
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h8" style={{ marginTop: "1em" }}>
        <br />
        Overzicht aantal trajecten per processtap (actief op einddatum periode)
      </Typography>

      <TableContainer component={Paper} style={{ marginTop: "0em" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Gemeentecode</TableCell>
              {processtappen.map((stap) => (
                <TableCell key={stap} align="center">{stapLabel(stap)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(tellingPerGemeenteEnStap).map(([gemeente, telling]) => (
              <TableRow key={gemeente}>
                <TableCell>{gemeente}</TableCell>
                {
                  processtappen.map((stap) => {
                    const bijbehorendeTrajecten = trajectenPerGemeente[gemeente]
                      .map((traject) => {
                        // 🔑 Zoek het originele indexnummer in de volledige set
                        const originalIndex = trajecten.findIndex((t) => t === traject);
                        return { traject, originalIndex };
                      })
                      .filter(({ traject }) => {
                        return bepaalLaatsteStap(traject) === stap;
                      });
                    return (
                      <TableCell
                        key={stap}
                        align="center"
                        {...(bijbehorendeTrajecten.length > 0 && {
                          onClick: () =>
                            openTrajectenDialog(
                              `Trajecten voor stap "${stap}" (gemeente ${gemeente}) (klik op traject op daarheen te gaan)`,
                              bijbehorendeTrajecten
                            ),
                          title: "Klik om de bijbehorende trajecten te bekijken",
                          style: {
                            cursor: "pointer",
                            color: "blue",
                            textDecoration: "underline"
                          }
                        })}
                      >
                        {bijbehorendeTrajecten.length}
                      </TableCell>
                    );
                  })
                }
              </TableRow>
            ))}
            <TableRow>
              <TableCell><strong>Totaal</strong></TableCell>
              {processtappen.map((stap) => (
                <TableCell key={stap} align="center">
                  {processtapTellingen[stap] || 0}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <div style={{ marginTop: '1em' }}>
        <span className="vet">LET OP:</span> de getoonde totalen zijn gebaseerd op de gegevens die je hebt ingevoerd of geüpload. Nadat je het bestand bij het CBS hebt ingediend, ontvang je een gedetailleerder ‘op-orde-rapport’. Op basis daarvan kun je besluiten de gegevens weer in te trekken voordat ze worden verwerkt. Het CBS publiceert jouw gegevens pas na jouw goedkeuring.
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
        <Typography
          variant="subtitle2"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 16px',
            backgroundColor: '#f5f5f5',
            fontWeight: 600
          }}
        >
          <span style={{ width: 15 }} />
          Gemeentecode | BSN | Omschrijving
        </Typography>
        <List>
            {selectedTrajectList.map(({ traject, originalIndex }, i) => (
              <ListItemButton
                key={originalIndex}
                button
                onClick={() => {
                  setCurrentTrajectIndex(originalIndex);
                  setActiveTab("schuldhulptrajecten");
                  setDialogOpen(false);
                }}
              >
              <ListItemIcon
                style={{
                  minWidth: 25,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  fontSize: 'small'
                }}
              >
                {i + 1}.
              </ListItemIcon>
              <ListItemText
                  primary={
                    `${traject.gemeentecode || 'gemeente onbekend'} | ${traject.client?.[0]?.Burgerservicenummer || 'BSN onbekend'} | ${traject.omschrijving?.trim() || 'geen omschrijving'}`
                  }
                  primaryTypographyProps={{
                    variant: 'subtitle2'
                  }}
              />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrajectOverzicht;
