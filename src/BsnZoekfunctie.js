import React, { useMemo, useState } from 'react';
import { Button, Form, ListGroup, Badge } from 'react-bootstrap';

const normaliseerBsn = (waarde) => {
  return String(waarde ?? '').replace(/\D/g, '');
};

const isBsnVeldnaam = (key) => {
  const genormaliseerdeKey = String(key)
    .toLowerCase()
    .replace(/[-_\s]/g, '');

  return (
    genormaliseerdeKey === 'bsn' ||
    genormaliseerdeKey === 'burgerservicenummer'
  );
};

const waardeOfVraagteken = (waarde) => {
  const tekst = String(waarde ?? '').trim();
  return tekst.length > 0 ? tekst : '?';
};

const haalClientenUitTraject = (traject) => {
  const clienten = Array.isArray(traject?.client) ? traject.client : [];

  return clienten
    .map((client) => {
      const bsn = normaliseerBsn(
        client?.Burgerservicenummer ??
        client?.burgerservicenummer ??
        client?.BSN ??
        client?.bsn
      );

      if (!bsn) {
        return null;
      }

      return {
        bsn,
        geboortedatum: waardeOfVraagteken(client?.Geboortedatum),
        postcode: waardeOfVraagteken(client?.Postcode),
        huisnummer: waardeOfVraagteken(client?.Huisnummer),
      };
    })
    .filter(Boolean);
};

const maakTrajectLabel = (traject, index) => {
  const omschrijving = traject?.omschrijving?.trim();

  if (omschrijving) {
    return `Traject ${index + 1}: ${omschrijving}`;
  }

  return `Traject ${index + 1}`;
};

function BsnZoekfunctie({ trajecten = [], currentTrajectIndex, setCurrentTrajectIndex }) {
  const [zoekterm, setZoekterm] = useState('');

  const zoektermBsn = normaliseerBsn(zoekterm);

  const trajectenMetClienten = useMemo(() => {
    return trajecten.map((traject, index) => {
      const clienten = haalClientenUitTraject(traject);

      return {
        traject,
        index,
        clienten,
      };
    });
  }, [trajecten]);

  const bsnOpties = useMemo(() => {
    const opties = new Map();

    trajectenMetClienten.forEach(({ index, clienten }) => {
      clienten.forEach(({ bsn }) => {
        if (!opties.has(bsn)) {
          opties.set(bsn, new Set());
        }

        opties.get(bsn).add(index);
      });
    });

    return [...opties.entries()]
      .map(([bsn, trajectIndexes]) => ({
        bsn,
        aantalTrajecten: trajectIndexes.size,
      }))
      .sort((a, b) => a.bsn.localeCompare(b.bsn));
  }, [trajectenMetClienten]);

  const autocompleteOpties = useMemo(() => {
    if (zoektermBsn.length < 3) {
      return [];
    }

    return bsnOpties.filter(({ bsn }) => bsn.startsWith(zoektermBsn));
  }, [bsnOpties, zoektermBsn]);

  const resultaten = useMemo(() => {
    if (zoektermBsn.length < 3) {
      return [];
    }

    return trajectenMetClienten
      .map(({ traject, index, clienten }) => ({
        traject,
        index,
        clienten: clienten.filter(({ bsn }) => bsn.startsWith(zoektermBsn)),
      }))
      .filter(({ clienten }) => clienten.length > 0);
  }, [trajectenMetClienten, zoektermBsn]);

  const gaNaarTraject = (index) => {
    setCurrentTrajectIndex(index);

    window.setTimeout(() => {
      document
        .getElementById('schuldhulptraject-detail')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <div className="p-3 mb-3 border rounded bg-white">
      <h3>Zoeken op BSN</h3>

      <p>
        Vul minimaal de eerste 3 cijfers van een BSN in. Daarna worden BSN’s getoond
        die in de huidige gegevensset voorkomen.
      </p>

      <Form.Group controlId="bsnZoekveld">
        <Form.Label><strong>BSN</strong></Form.Label>
        <Form.Control
          type="search"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Bijvoorbeeld 123456794"
          value={zoekterm}
          list="bsn-autocomplete-opties"
          onChange={(event) => setZoekterm(event.target.value)}
        />

        <datalist id="bsn-autocomplete-opties">
          {autocompleteOpties.map(({ bsn, aantalTrajecten }) => (
            <option
              key={bsn}
              value={bsn}
              label={`${aantalTrajecten} traject${aantalTrajecten === 1 ? '' : 'en'}`}
            />
          ))}
        </datalist>
      </Form.Group>

      {zoektermBsn.length > 0 && zoektermBsn.length < 3 && (
        <div className="text-muted mt-2">
          Voer minimaal 3 cijfers in om te zoeken.
        </div>
      )}

      {zoektermBsn.length >= 3 && resultaten.length === 0 && (
        <div className="alert alert-info mt-3 mb-0">
          Geen trajecten gevonden met een BSN dat begint met {zoektermBsn}.
        </div>
      )}

      {resultaten.length > 0 && (
        <div className="mt-3">
          <div className="mb-2">
            <strong>
              {resultaten.length} traject{resultaten.length === 1 ? '' : 'en'} gevonden
            </strong>
          </div>

          <ListGroup className="bsn-zoekresultaten-lijst">
            {resultaten.map(({ traject, index, clienten }) => (
              <ListGroup.Item
                key={index}
                active={index === currentTrajectIndex}
                className="d-flex justify-content-between align-items-start"
              >
                <div>
                  <div className="fw-bold">
                    {maakTrajectLabel(traject, index)}
                  </div>

                  <div>
                    {clienten.map((client) => (
                      <div key={client.bsn} className="mb-1">
                        <Badge bg="secondary" className="me-1">
                          {client.bsn}
                        </Badge>
                        <span className="small">
                          (geb.: {client.geboortedatum}, adres: {client.postcode} {client.huisnummer})
                        </span>
                      </div>
                    ))}
                  </div>

                  {traject?.gemeentecode && (
                    <div className="small mt-1">
                      Gemeentecode: {traject.gemeentecode}
                    </div>
                  )}

                  {(traject?.startdatum || traject?.einddatum) && (
                    <div className="small">
                      Periode: {traject?.startdatum || '?'} t/m {traject?.einddatum || '?'}
                    </div>
                  )}
                </div>

                <Button
                  variant={index === currentTrajectIndex ? 'light' : 'outline-primary'}
                  size="sm"
                  onClick={() => gaNaarTraject(index)}
                >
                  ga naar traject
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
}

export default BsnZoekfunctie;
