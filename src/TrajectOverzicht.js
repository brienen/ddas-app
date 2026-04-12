import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Paper, Dialog,
  DialogTitle, DialogContent, List, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import { Typography } from '@mui/material';
import './MainForm.css';

const processtappen = [
  "aanmelding",
  "intake",
  "stabilisatie",
  "schuldregeling",
  "oplossing",
  "nazorg",
  "uitstroom",
  "onbekend*"
];

const TrajectOverzicht = ({ trajecten, formAlgemeen, setCurrentTrajectIndex, setActiveTab }) => {
  const formatDatum = (d) =>
    d
      ? new Intl.DateTimeFormat('nl-NL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date(d))
      : 'onbekend*';

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

  const stapLabel = (naam) =>
    naam.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (s) => s.toUpperCase());

  const openTrajectenDialog = (titel, trajectenLijst) => {
    setDialogTitle(titel);
    setSelectedTrajectList(trajectenLijst);
    setDialogOpen(true);
  };

  const datumInPeriode = (datum) => {
    if (!datum) return false;
    const d = new Date(datum);
    return d >= startLevering && d <= eindLevering;
  };

  const clientIsActiefInTraject = (traject) => {
    return processtappen.some((stap) => {
      let stapData = traject[stap];
      if (!stapData) return false;

      const items = Array.isArray(stapData) ? stapData : [stapData];

      return items.some((item) => {
        if (!item) return false;

        const relevanteDatum =
          stap === 'uitstroom'
            ? (item.datum ?? item.datumAfronding ?? item.startdatum)
            : (item.startdatum ?? item.datum ?? item.datumAfronding);

        return datumInPeriode(relevanteDatum);
      });
    });
  };

  const trajectenPerGemeente = {};
  trajecten.forEach((traject) => {
    const code = traject?.gemeentecode || 'onbekend*';
    if (!trajectenPerGemeente[code]) {
      trajectenPerGemeente[code] = [];
    }
    trajectenPerGemeente[code].push(traject);
  });

  // Eerste tabel: aantal trajecten en unieke actieve cliënten per gemeente
  const gemeenteOverzicht = {};

  trajecten.forEach((traject, index) => {
    const gemeente = traject?.gemeentecode || 'onbekend*';

    if (!gemeenteOverzicht[gemeente]) {
      gemeenteOverzicht[gemeente] = {
        trajectenAantal: 0,
        trajectIndices: [],
        alleClientBSNs: new Set(),
        actieveClientBSNs: new Set(),
        actieveClientTrajecten: new Set()
      };
    }

    gemeenteOverzicht[gemeente].trajectenAantal += 1;
    gemeenteOverzicht[gemeente].trajectIndices.push(index);

    const trajectIsActief = clientIsActiefInTraject(traject);
    const clients = Array.isArray(traject.client) ? traject.client : [];

    clients.forEach((client) => {
      const bsn = client?.Burgerservicenummer?.trim();
      if (!bsn) return;

      gemeenteOverzicht[gemeente].alleClientBSNs.add(bsn);

      if (trajectIsActief) {
        gemeenteOverzicht[gemeente].actieveClientBSNs.add(bsn);
        gemeenteOverzicht[gemeente].actieveClientTrajecten.add(index);
      }
    });

  });

  const sortedGemeenten = Object.keys(gemeenteOverzicht).sort((a, b) => {
    if (sortKey === 'gemeentecode') {
      return sortDirection === 'asc'
        ? a.localeCompare(b)
        : b.localeCompare(a);
    }

    const aValue =
      sortKey === 'trajecten'
        ? gemeenteOverzicht[a].trajectenAantal
        : sortKey === 'alleClienten'
          ? gemeenteOverzicht[a].alleClientBSNs.size
          : gemeenteOverzicht[a].actieveClientBSNs.size;

    const bValue =
      sortKey === 'trajecten'
        ? gemeenteOverzicht[b].trajectenAantal
        : sortKey === 'alleClienten'
          ? gemeenteOverzicht[b].alleClientBSNs.size
          : gemeenteOverzicht[b].actieveClientBSNs.size;

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const totaalTrajecten = sortedGemeenten.reduce(
    (sum, gemeente) => sum + gemeenteOverzicht[gemeente].trajectenAantal,
    0
  );
  const totaalAlleClientenPerGemeente = sortedGemeenten.reduce(
    (sum, gemeente) => sum + gemeenteOverzicht[gemeente].alleClientBSNs.size,
    0
  );

// Totaal aantal unieke BSN's kan je over de hele set tellen (als 1 BSN in 2 gemeenten voorkomt, wordt die maar 1x geteld):
//  const alleUniekeActieveBSNs = new Set();
//  sortedGemeenten.forEach((gemeente) => {
//    gemeenteOverzicht[gemeente].actieveClientBSNs.forEach((bsn) =>
//      alleUniekeActieveBSNs.add(bsn)
//    );
//  });
// In de tabel komt dit als: <TableCell align="center">{alleUniekeActieveBSNs.size}</TableCell>

// of gewoon de aantallen per gemeente optellen
  const totaalActieveClientenPerGemeente = sortedGemeenten.reduce(
    (sum, gemeente) => sum + gemeenteOverzicht[gemeente].actieveClientBSNs.size,
    0
  );

  // Tweede tabel: per cliënt alleen de meest recente stap in de rapportageperiode
  const bepaalLaatsteStapVoorClient = (trajectenVanGemeente) => {
    const clientLaatsteStap = {};

    trajectenVanGemeente.forEach((traject) => {
      const originalIndex = trajecten.findIndex((t) => t === traject);
      if (originalIndex === -1) return;

      const clients = Array.isArray(traject.client) ? traject.client : [];

      clients.forEach((client) => {
        const bsn = client?.Burgerservicenummer?.trim();
        if (!bsn) return;

        if (!clientLaatsteStap[bsn]) {
          clientLaatsteStap[bsn] = {
            stap: "onbekend*",
            datum: null,
            traject,
            originalIndex
          };
        }

        processtappen.forEach((stap) => {
          if (stap === "onbekend*") return;

          let stapData = traject[stap];
          if (!stapData) return;

          const items = Array.isArray(stapData) ? stapData : [stapData];

          items.forEach((item) => {
            if (!item) return;

            const datum =
              item.startdatum ??
              item.datumAfronding ??
              item.datum;

            if (!datum) return;

            const d = new Date(datum);
            if (d < startLevering || d > eindLevering) return;

            if (
              !clientLaatsteStap[bsn].datum ||
              d > clientLaatsteStap[bsn].datum
            ) {
              clientLaatsteStap[bsn] = {
                stap,
                datum: d,
                traject,
                originalIndex
              };
            }
          });
        });
      });
    });
    return clientLaatsteStap;
  };

  const clientenPerGemeenteEnStap = {};
  const trajectenPerGemeenteEnStap = {};
  const totalenPerGemeente = {};

  Object.entries(trajectenPerGemeente).forEach(([gemeente, lijst]) => {
    const laatsteStapPerClient = bepaalLaatsteStapVoorClient(lijst);

    const telling = {};
    const trajectenPerStap = {};

    processtappen.forEach((stap) => {
      telling[stap] = 0;
      trajectenPerStap[stap] = [];
    });

    Object.entries(laatsteStapPerClient).forEach(([bsn, info]) => {
      const { stap, traject, originalIndex } = info;

      if (telling[stap] !== undefined) {
        telling[stap]++;

        trajectenPerStap[stap].push({
          traject,
          originalIndex
        });
      }
    });

    clientenPerGemeenteEnStap[gemeente] = telling;
    trajectenPerGemeenteEnStap[gemeente] = trajectenPerStap;
    totalenPerGemeente[gemeente] = Object.keys(laatsteStapPerClient).length;
  });

  const totalenPerStap = {};
  processtappen.forEach((stap) => {
    totalenPerStap[stap] = 0;
  });

  Object.values(clientenPerGemeenteEnStap).forEach((telling) => {
    processtappen.forEach((stap) => {
      totalenPerStap[stap] += telling[stap];
    });
  });

  const totaalAlleClienten = Object.values(totalenPerGemeente).reduce(
    (sum, val) => sum + val,
    0
  );

  return (
    <div>
      <p style={{ fontSize: '0.9em' }}>
        Rapportageperiode: {formatDatum(startLevering)} - {formatDatum(eindLevering)}
      </p>

      <Typography variant="h8" style={{ marginTop: "1em" }}>
        Overzicht aantal trajecten en cliënten (BSN's) per gemeentecode
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

              <TableCell align="center">
                <TableSortLabel
                  active={sortKey === 'trajecten'}
                  direction={sortDirection}
                  onClick={() => handleSort('trajecten')}
                >
                  Aantal trajecten
                </TableSortLabel>
              </TableCell>

              <TableCell align="center">
                <TableSortLabel
                  active={sortKey === 'alleClienten'}
                  direction={sortDirection}
                  onClick={() => handleSort('alleClienten')}
                >
                  Unieke BSN's
                </TableSortLabel>
              </TableCell>

              <TableCell align="center">
                <TableSortLabel
                  active={sortKey === 'actieveClienten'}
                  direction={sortDirection}
                  onClick={() => handleSort('actieveClienten')}
                >
                  Unieke actieve BSN's*
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedGemeenten.map((gemeente) => {
              const gegevens = gemeenteOverzicht[gemeente];

              const alleTrajecten = gegevens.trajectIndices.map((i) => ({
                traject: trajecten[i],
                originalIndex: i
              }));

              const actieveClientTrajecten = Array.from(
                gegevens.actieveClientTrajecten
              ).map((i) => ({
                traject: trajecten[i],
                originalIndex: i
              }));

              return (
                <TableRow key={gemeente}>
                  <TableCell>{gemeente}</TableCell>

                  <TableCell
                    align="center"
                    {...(gegevens.trajectenAantal > 0 && {
                      onClick: () =>
                        openTrajectenDialog(
                          `Trajecten in gemeente ${gemeente} (klik op traject om daarheen te gaan)`,
                          alleTrajecten
                        ),
                      title: "Klik om de bijbehorende trajecten te bekijken",
                      style: {
                        cursor: "pointer",
                        color: "blue",
                        textDecoration: "underline"
                      }
                    })}
                  >
                    {gegevens.trajectenAantal}
                  </TableCell>

                  <TableCell align="center">
                    {gegevens.alleClientBSNs.size}
                  </TableCell>

                  <TableCell
                    align="center"
                    {...(gegevens.actieveClientBSNs.size > 0 && {
                      onClick: () =>
                        openTrajectenDialog(
                          `Trajecten met actieve cliënten in gemeente ${gemeente} (klik op traject om daarheen te gaan)`,
                          actieveClientTrajecten
                        ),
                      title: "Klik om de bijbehorende trajecten te bekijken",
                      style: {
                        cursor: "pointer",
                        color: "blue",
                        textDecoration: "underline"
                      }
                    })}
                  >
                    {gegevens.actieveClientBSNs.size}
                  </TableCell>
                </TableRow>
              );
            })}

            <TableRow>
              <TableCell><strong>Totaal</strong></TableCell>
              <TableCell align="center"><strong>{totaalTrajecten}</strong></TableCell>
                <TableCell align="center"><strong>{totaalAlleClientenPerGemeente}</strong></TableCell>
              <TableCell align="center"><strong>{totaalActieveClientenPerGemeente}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <p className="klein">*: actief wil zeggen dat er een processtap tijdens de rapportageperiode is gestart of de cliënt tijdens de rapportageperiode is uitgestroomd</p>

      <Typography variant="h8" style={{ marginTop: "1em" }}>
        <br />
        Overzicht unieke actieve cliënten per meest recente processtap
      </Typography>

      <TableContainer component={Paper} style={{ marginTop: "0em" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Gemeentecode</TableCell>
              {processtappen.map((stap) => (
                <TableCell key={stap} align="center">{stapLabel(stap)}</TableCell>
              ))}
              <TableCell align="center"><strong>Totaal</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
          {sortedGemeenten.map((gemeente) => {
            const telling = clientenPerGemeenteEnStap[gemeente];

            return (
              <TableRow key={gemeente}>
                <TableCell>{gemeente}</TableCell>

                {processtappen.map((stap) => {
                  const bijbehorendeTrajecten = trajectenPerGemeenteEnStap[gemeente][stap];

                  return (
                    <TableCell
                      key={stap}
                      align="center"
                      {...(telling[stap] > 0 && {
                        onClick: () =>
                          openTrajectenDialog(
                            `Cliënten in stap "${stap}" (gemeente ${gemeente})`,
                            bijbehorendeTrajecten
                          ),
                        style: {
                          cursor: "pointer",
                          color: "blue",
                          textDecoration: "underline"
                        }
                      })}
                    >
                      {telling[stap]}
                    </TableCell>
                  );
                })}

                <TableCell align="center">
                  <strong>{totalenPerGemeente[gemeente]}</strong>
                </TableCell>
              </TableRow>
            );
          })}

            <TableRow>
              <TableCell><strong>Totaal</strong></TableCell>

              {processtappen.map((stap) => (
                <TableCell key={stap} align="center">
                  <strong>{totalenPerStap[stap]}</strong>
                </TableCell>
              ))}

              <TableCell align="center">
                <strong>{totaalAlleClienten}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <p className="klein">*: onbekend wil zeggen dat er geen processtap is gevonden die tijdens de rapportageperiode is gestart</p>

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
                    `${traject.gemeentecode || 'gemeente onbekend*'} | ${traject.client?.[0]?.Burgerservicenummer || 'BSN onbekend*'} | ${traject.omschrijving?.trim() || 'geen omschrijving'}`
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
