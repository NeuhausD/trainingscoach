import { Decoder, Stream } from "@garmin/fitsdk";
import { summarizeFit, type DecodedMessages, type FitSummary } from "@/lib/domain/fit-mapping";

/** Maximale Dateigrösse, die der Upload annimmt (Vercel-Functions erlauben 4.5 MB je Anfrage). */
export const MAX_FIT_BYTES = 4 * 1024 * 1024;

export class FitParseError extends Error {}

/**
 * FIT-Datei mit dem offiziellen Garmin FIT SDK dekodieren (ADR 0007). Es werden
 * nur die Summen der Session übernommen, Records und GPS-Punkte verwirft der
 * Aufrufer sofort wieder.
 */
export function parseFit(bytes: Uint8Array): FitSummary {
  if (bytes.byteLength > MAX_FIT_BYTES) throw new FitParseError("Datei ist grösser als 4 MB. Bitte die Aktivität in Garmin Connect mit geringerer Aufzeichnungsrate exportieren.");
  const stream = Stream.fromByteArray(bytes);
  if (!Decoder.isFIT(stream)) throw new FitParseError("Keine FIT-Datei. Bitte die .fit-Datei aus dem entpackten Garmin-Export wählen.");
  const decoder = new Decoder(stream);
  if (!decoder.checkIntegrity()) throw new FitParseError("FIT-Datei ist beschädigt (Prüfsumme stimmt nicht). Bitte erneut aus Garmin Connect exportieren.");
  const { messages, errors } = decoder.read({ includeUnknownData: true, mergeHeartRates: false });
  const summary = summarizeFit(messages as DecodedMessages);
  if (!summary) {
    const detail = errors.length > 0 ? ` (${errors[0] instanceof Error ? errors[0].message : String(errors[0])})` : "";
    throw new FitParseError(`FIT-Datei enthält keine Aktivität${detail}. Nur Aktivitätsdateien werden übernommen.`);
  }
  return summary;
}
