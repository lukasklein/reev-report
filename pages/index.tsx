import Head from "next/head";
import { FC, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";

const fileTypes = ["XLSX"];

export default function Home() {
  const [ladevorgaenge, setLadevorgaenge] = useState([]);
  const [ladekarte, setLadekarte] = useState("");
  const [ladekarteName, setLadekarteName] = useState("");
  const ladekarten = useMemo(() => {
    // @ts-ignore
    return ladevorgaenge
      .map((ladevorgang) => (ladevorgang as any).ladekarte)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [ladevorgaenge]);
  useEffect(() => {
    if(ladekarteName) {
      // update ladevorgaenge
      setLadevorgaenge(ladevorgaenge.map((lfg) => ({
        ...lfg,
        ladekarteOverride: ladekarteName,
      })));
    }
  }, [ladekarteName, ladevorgaenge]);
  const [tarif, setTarif] = useState(0.3757);
  const [date, setDate] = useState(new Date());
  const [range, setRange] = useState([new Date(), new Date()]);
  const componentRef = useRef();

  const handleChange = (file: any) => {
    var reader = new FileReader();
    reader.onload = function (e) {
      setLadevorgaenge([]);
      setLadekarte("");
      if (!e.target) return;
      var data = e.target.result;
      let readedData = XLSX.read(data, { type: "binary", cellDates: true });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];

      /* Convert array to json*/
      const dataParse: any = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log({ dataParse });
      setDate(dataParse[0][1]);
      setRange([dataParse[1][1], dataParse[1][3]]);
      for (let i = 4; i < dataParse.length; i++) {
        const [
          _,
          kostenstelle,
          info1,
          info2,
          kennzeichen,
          nutzer,
          email,
          ladekarte,
          eingestecktAm,
          ausgestecktAm,
          ladedauer,
          zeitAngesteckt,
          parkgebuehrZeit,
          standort,
          ladestation,
          anschluss,
          evseId,
          __,
          preisProKwh,
          verbrauch,
          signierteZaehlerwerte,
          zaehlerstandStart,
          zaehlerstandEnde,
          standorttyp
        ] = dataParse[i];

        if (!ladekarte) continue;
        // @ts-ignore
        setLadevorgaenge((prevState) => [
          ...prevState,
          {
            ladekarte,
            eingestecktAm,
            ausgestecktAm,
            ladedauer,
            zeitAngesteckt,
            ladestation,
            anschluss,
            evseId,
            verbrauch,
          },
        ]);
        setLadekarte(ladekarte);
        setLadekarteName(ladekarte);
      }
    };
    reader.readAsBinaryString(file);
  };
  const handleChangeWARP = (file: any) => {
    var reader = new FileReader();
    reader.onload = function (e) {
      setLadevorgaenge([]);
      setLadekarte("");
      if (!e.target) return;
      
      // Parse CSV data and filter out empty lines
      const csvData = (e.target.result as string)
        .split('\n')
        .filter(line => line.trim() !== '') // Skip empty lines
        .map(row => row.split(';')
        .map(cell => cell.replace(/^"|"$/g, ''))); // Remove quotes
      
      // Skip header row
      csvData.shift();
      
      // Helper function to parse date string
      const parseDate = (dateStr: string) => {
        // Format: "2025-03-28 13:21:48"
        const [date, time] = dateStr.split(' ');
        const [year, month, day] = date.split('-');
        const [hours, minutes, seconds] = time.split(':');
        return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
      };

      // Set current date and date range
      const firstEntry = csvData[0];
      const lastEntry = csvData[csvData.length - 1];
      if (firstEntry && lastEntry) {
        setDate(new Date());
        setRange([parseDate(firstEntry[0]), parseDate(lastEntry[0])]);
      }

      // Process each row
      csvData.forEach(row => {
        if (row.length < 8) return; // Skip invalid rows
        
        const [
          startTime,
          displayName,
          chargedEnergy,
          chargeDuration,
          _,
          meterStart,
          meterEnd,
          username
        ] = row;

        if (!username) return;
        
        const startDate = parseDate(startTime);
        
        // @ts-ignore
        setLadevorgaenge((prevState) => [
          ...prevState,
          {
            ladekarte: username,
            eingestecktAm: startDate,
            ausgestecktAm: new Date(startDate.getTime() + parseInt(chargeDuration) * 1000),
            ladedauer: parseInt(chargeDuration),
            zeitAngesteckt: parseInt(chargeDuration),
            ladestation: displayName,
            anschluss: '-',
            evseId: '-',
            verbrauch: parseFloat(chargedEnergy),
          },
        ]);
        setLadekarte(username);
        setLadekarteName(username);
      });
    };
    reader.readAsText(file);
  };

  const handleChangeEVCC = (file: any) => {
    var reader = new FileReader();
    reader.onload = function (e) {
      setLadevorgaenge([]);
      setLadekarte("");
      if (!e.target) return;
      
      // Parse CSV data and filter out empty lines
      const csvData = (e.target.result as string)
        .split('\n')
        .filter(line => line.trim() !== '') // Skip empty lines
        .map(row => row.split(',')
        .map(cell => cell.replace(/^"|"$/g, ''))); // Remove quotes
      
      // Skip header row
      csvData.shift();
      
      // Helper function to parse date string
      const parseDate = (dateStr: string) => {
        // Format: "2025-03-28 13:21:48"
        const [date, time] = dateStr.split(' ');
        const [year, month, day] = date.split('-');
        const [hours, minutes, seconds] = time.split(':');
        return new Date(+year, +month - 1, +day, +hours, +minutes, +seconds);
      };

      // Set current date and date range
      const firstEntry = csvData[0];
      const lastEntry = csvData[csvData.length - 1];
      if (firstEntry && lastEntry) {
        setDate(new Date());
        setRange([parseDate(firstEntry[0]), parseDate(lastEntry[0])]);
      }

      // Process each row
      csvData.forEach(row => {
        if (row.length < 8) return; // Skip invalid rows
        
        const [
          startTime,
          endTime,
          chargingPoint,
          displayName,
          username,
          mileage,
          meterStart,
          meterEnd,
          chargedEnergy,
          chargeDuration,
          solar,
          price,
          kwHprice,
          co2
        ] = row;

        if (!username) return;
        
        const startDate = parseDate(startTime);
        const endDate = parseDate(endTime);
        
        // @ts-ignore
        setLadevorgaenge((prevState) => [
          ...prevState,
          {
            ladekarte: username,
            eingestecktAm: startDate,
            ausgestecktAm: endDate,
            ladedauer: parseInt(chargeDuration),
            zeitAngesteckt: parseInt(chargeDuration),
            ladestation: displayName,
            anschluss: '-',
            evseId: '-',
            verbrauch: parseFloat(chargedEnergy),
          },
        ]);
        setLadekarte(username);
        setLadekarteName(username);
      });
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Head>
        <title>Reev Report Generator</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="max-w-4xl mx-auto space-y-4 py-12">
      <label>Reev</label>
        <FileUploader
          handleChange={handleChange}
          name="file"
          types={fileTypes}
        />
      <label>Tinkerforge WARP</label>
        <FileUploader
          handleChange={handleChangeWARP}
          name="file"
          types={["CSV"]}
        />
        <label>EVCC</label>
        <FileUploader
          handleChange={handleChangeEVCC}
          name="file"
          types={["CSV"]}
        />
        {!!ladevorgaenge.length && (
          <>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Ladekarte
              </label>
              <select
                id="location"
                name="location"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                defaultValue={ladekarte}
                onChange={(e) => {
                  setLadekarte(e.target.value);
                  setLadekarteName(e.target.value);
                }}
              >
                {ladekarten.map((lk) => (
                  <option key={lk} value={lk}>
                    {lk}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ladekarteName"
                className="block text-sm font-medium text-gray-700"
              >
                Ladekarte Name
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  type="text"
                  name="ladekarteName"
                  id="ladekarteName"
                  className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Ladekarte Name"
                  value={ladekarteName}
                  onChange={(e) => setLadekarteName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Tarif
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
                <input
                  type="number"
                  step="any"
                  name="price"
                  id="price"
                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                  aria-describedby="price-currency"
                  value={tarif}
                  onChange={(e) => setTarif(parseFloat(e.target.value))}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span
                    className="text-gray-500 sm:text-sm"
                    id="price-currency"
                  >
                    EUR
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
        {ladekarte && (
          <>
            <ReactToPrint
              trigger={() => (
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 -ml-1 mr-1">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
</svg>

                  Drucken
                </button>
              )}
              // @ts-ignore
              content={() => componentRef.current}
            />
            <Ladevorgaenge
              // @ts-ignore
              ref={componentRef}
              {...{
                date,
                tarif,
                range,
                ladevorgaenge: ladevorgaenge
                  .filter((lv) => (lv as any).ladekarte === ladekarte)
                  .reverse(),
              }}
            />
          </>
        )}
      </div>
    </>
  );
}

const Ladevorgaenge: FC<{
  date: Date;
  ladevorgaenge: any[];
  tarif: number;
  range: [Date, Date];
}> = forwardRef(function Ladevorgaenge({ date, range, ladevorgaenge, tarif }, ref) {
  return (
    // @ts-ignore
    <div className="flex flex-col space-y-4 px-8 py-8" ref={ref}>
      <div className="text-right">
        {date.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </div>
      <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        Dienstwagen-Ladevorgänge{" "}
        {range[0].toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}{" "}
        -{" "}
        {range[1].toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </h2>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                Ladevorgang
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                kWh
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Tarif
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white font-mono">
            {ladevorgaenge.map((lfg, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {lfg.eingestecktAm.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  {lfg.eingestecktAm.toLocaleTimeString("de-DE")} -{" "}
                  {lfg.ausgestecktAm.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  {lfg.ausgestecktAm.toLocaleTimeString("de-DE")} |{" "}
                  {lfg.ladekarteOverride || lfg.ladestation}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {lfg.verbrauch.toLocaleString("de-DE")}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {tarif.toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-right space-y-2 text-xl pt-6">
        <div>
          Gesamtverbrauch (in kWh):{" "}
          {ladevorgaenge
            .reduce((acc, lfg) => acc + lfg.verbrauch, 0)
            .toLocaleString("de-DE")}
        </div>
        <div className="font-bold">
          Auslagensumme (brutto):{" "}
          {ladevorgaenge
            .reduce((acc, lfg) => acc + lfg.verbrauch * tarif, 0)
            .toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
              currencyDisplay: "symbol",
            })}
        </div>
      </div>
    </div>
  );
});
