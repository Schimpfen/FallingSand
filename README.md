Projektbeschreibung – Fließsand-Zellulärer Automat

Dieses Projekt untersucht das Verhalten unterschiedlicher Sandkörnungen auf einer Oberfläche mithilfe eines einfachen zellulären Automaten. Ausgangspunkt ist eine Fragestellung aus der Betontechnik: In der Realität versucht man, verschiedenste Sandformen und -größen im Material zu nutzen, doch sehr runde oder sehr feine Körner verrieseln und bilden Klumpen, was die gewünschte Oberflächenstruktur verhindert.

 Das Modell abstrahiert diese physikalischen Effekte, indem es zwei Körnungstypen simuliert:

Runde Körner, die leichter rollen und weniger stabil liegen

Eckige Körner, die sich eher verhaken, schwerer verrutschen und lokalere Strukturen bilden

 Die Körner interagieren mit einer definierten Oberfläche bzw. Topologie. Zunächst existiert eine ebene, glatte Fläche, auf die Sand Schritt für Schritt aufgebracht wird. Systematisch entsteht dadurch ein simuliertes „Aufschütten“ des Materials.

 Statt komplexer Messmethoden wie realen Schüttwinkeln konzentriert sich das Modell auf eine einfache Messgröße: die Differenz zwischen dem höchsten und dem tiefsten Punkt der Schüttung. Dadurch lassen sich direkte Aussagen über Verrieselung, Haufenstabilität und Klumpungsneigung treffen.

 Das Verhalten wird durch einfache lokale Update-Regeln gesteuert. In einer Art „Agentenmodus“ übernimmt jedes Sandkorn die Rolle eines einzelnen Akteurs:

Wenn kein Sandkorn unter mir ist, darf ich nach unten fallen.

Runde Körner bevorzugen seitliches Rutschen, wenn sie instabil liegen.

Eckige Körner bleiben eher an Ort und Stelle oder bewegen sich nur, wenn eine klare Fallrichtung existiert.

Die Oberfläche bzw. Topologie beeinflusst, wie Körner liegen bleiben oder abrutschen.

[Unverified] Die Regeln orientieren sich am bekannten Falling-Sand-Ansatz, sind jedoch vereinfacht und an die Anforderungen der Übungsaufgabe angepasst.

README – Fließsand-Zellulärer Automat
Projektziel

Simulation der Interaktion zweier Sandkorntypen (rund, eckig) auf einer Oberfläche mithilfe eines zellulären Automaten. Ziel ist die Analyse des Haufens, der sich durch wiederholtes Aufbringen von Sand bildet.

## Task 1 Short Answer
- **Rule 1 (Gravity):** Each grain falls straight down whenever the cell beneath it is `EMPTY`.
- **Rule 2 (Diagonal Sliding):** If blocked vertically, fine grains always slide diagonally into an empty slot, while coarse grains follow those diagonals with a 5% probability so steeper piles remain.
- **Rule 3 (Lateral Flow):** When fine grains can no longer drop or slide diagonally, they spread horizontally into neighboring empty cells to mimic high flowability.

Hintergrund

Inspiriert durch Probleme in der Betontechnik: Unterschiedliche Körnungen verhalten sich im Schüttvorgang unterschiedlich – manche verrieseln stark, andere verklumpen oder bilden stabile Strukturen.

Features

 • Zwei Sandkornformen
 • Einstellbare Oberflächentopologie
 • Schrittweises Aufschütten („Sedimentierung“)
 • Einfaches Stabilitätsmaß (Differenz tiefster–höchster Punkt)
 • Lokale Regeln nach Falling-Sand-Prinzip

Regelwerk (Kurzfassung)

 1. Korn fällt, wenn darunter ein leerer Gitterplatz ist
 2. Runde Körner dürfen leichter seitlich rutschen
 3. Eckige Körner rutschen nur bei eindeutiger Fallrichtung
4. Topologie beeinflusst Fallrichtung (z. B. Schräge, Vertiefung)

Agentenperspektive (optional)

 „Ich bin das Sandkorn – wenn ich keinen Halt habe, falle ich. Wenn ich rund bin, rolle ich leichter zur Seite. Wenn ich eckig bin, bleibe ich lieber wie ich bin.“

Datei-/Projektbezug
 Siehe Begleitdokument FallingSand-Aufgabenstellung für Kontext und Rahmenbedingungen aus der Übung.

 10 - 20 Seiten / keine Ganzen Code Blöcke in der Docu

## CA Fachbegriffe im Projekt
- **Zellraum (Cell-space / lattice):** Wir simulieren auf einem rechteckigen Raster (`width` × `height`), das als diskretisierter Teilraum dient.
- **Zustandsraum (State-space):** Jede Zelle hält einen Zustand aus `{EMPTY, FINE, COARSE, WALL}`; er wird durch den lokalen Update-Wurf verändert.
- **Nachbarschaft (Neighbourhood):** Die Update-Regeln prüfen das Moore-artige Umfeld (unten, unten-links, unten-rechts) für Freiraum und benachbarte Zellen.
- **Transitionsregel (Update Rule):** Die Regel folgt Reihenfolge Rule 1 (Gravity) → Rule 2 (Diagonal Sliding) → Rule 3 (Fine Lateral Flow), wobei alle Zellen gleichzeitig durch eine zeilenweise Rückwärtsiteration aktualisiert werden.
- **Stochastik:** Feine Körner handeln deterministisch, grobe Körner folgen nur mit 5 % Wahrscheinlichkeit dem diagonalen Gleiten, die restlichen Fälle lassen sie steiler aufschichten.

## Notebook als zentrales Dokument
`fallingsand.ipynb` stellt den vollständigen Arbeitsbericht dar: Modellbeschreibung, Umsetzungshinweise, Experimente und Visualisierungen. Öffne ihn mit Jupyter (`jupyter notebook fallingsand.ipynb` oder `jupyter lab`) und führe die Zellen aus, die das Vokabular durchgehen, den eingebetteten `SimulationEngine`-Kern und die Sandbox-Hilfsmittel laden und die Matplotlib-Visualisierung aktualisieren. Damit werden Task 1–4 reproduziert und interaktiv demonstriert.

## Ausführung
- `pip install -r requirements.txt`
- `jupyter notebook fallingsand.ipynb` (oder `jupyter lab fallingsand.ipynb`)
- Alternativ lässt sich der schnelle Sandbox-Loop direkt im Notebook über die spezielle Zelle starten; passen Sie `frames`, `floor_profile` oder `mix_ratio` an und führen Sie `run_sandbox(...)` aus.



Person 1: Fachliches Konzept (Höller Maximmilian)

Kurze Recherche (z.B. aus „Cellular Automata.pdf“ / „Agent‑Based Modelling.pdf“),
Definition der Modellidee (Gitter, Zustände: leer/Sand/Wand/... und Regeln, wann ein Partikel fällt, rutscht etc.),
Beschreibung der Ziele und der geplanten Experimente.

Person 2: Simulationskern (Max Schimpf)

Implementierung der Datenstrukturen (Gitter, Partikelzustände),
Update‑Regeln als Algorithmus (z.B. zeilenweise Aktualisierung, Konfliktauflösung),


Person 3: Visualisierung & Interaktion (Kilian, Köck)

Darstellung der Simulation (2D‑Raster, Farben für Materialien),
Eingaben (Maus/Tastatur: Partikel „malen“, Parameter ändern),
ggf. einfache Menü‑ oder Slider‑Steuerung.

Person 4: Tests, Experimente & Dokumentation (Jonas,Höckner)

Testfälle (z.B. einfache Szenarien, in denen klar ist, wie sich das System verhalten soll),
Durchführung von Experimenten (verschiedene Parameter, Dichten, Startkonfigurationen),
Auswertung (Plots, Screenshots) und Schreiben des Berichts/Präsentation.
## Modellierung mit Cellular Automata (CA)
Die Simulation nutzt einen klassischen Cellular Automaton (CA) als mikroskopische Beschreibung. Das System arbeitet auf einem rechteckigen Lattice (kartesisches Grid), alle Zellen haben Zust?nde (`EMPTY`, `FINE`, `COARSE`, `WALL`). Die Nachbarschaften ergeben sich aus relativen Offsets ((i,j)->(i?1,j), (i,j?1), (i?1,j?1)) und erlauben sowohl Moore- als auch Von-Neumann-Stencils. Die Kerndefinitionen (`emit()`, `step()`, `_available(...)`, `snapshot()`) sind jetzt direkt im Notebook enthalten, sodass Nachbarschaftsprüfungen und Ränder konsistent behandelt werden.

`step()` l?uft ?ber diskrete Zeitpunkte t0,t1,... und folgt den Regeln: Fall in freien Raum (grid[y+1,x]==EMPTY), diagonales Gleiten mit Wahrscheinlichkeiten `p_fine`/`p_coarse` und seitliches Ausweichen f?r FEINE K?rner. `emit()` f?llt die Quelle zentral, `snapshot()` liefert das Grid plus Metriken (`delta_h`, `top_height`, `bottom_height`).

## Visualisierung & Steuerung auf drei Ebenen
1. **Sandbox (Notebook)** startet die Engine direkt im Notebook: `SandboxVisualizer` treibt die Animation, `run_sandbox(...)` gibt den Grafikausgang frei und protokolliert die Metrikwerte nach einer Serie von Emit/Step-Zyklen.
2. **API (`simulation_api.py`)** bietet `GET /state`, `GET /metrics`, `GET /mix`/`/ratio`, `POST /step`/`/advance`, `POST /emit`, `POST /mix`/`/ratio` als saubere JSON-Schnittstelle. `/mix` akzeptiert Query oder JSON ("{"value":...}") und klammert das Ergebnis in `SimulationEngine.set_mix`.
3. **Qt-Client (`qt_client.py`)** nutzt `Qt.py`, `SimulationClient` (metrics, step, emit, set_mix) und `ControlPanel` (Slider, Step-Button, Delta-h-Label) f?r die dynamische Kartografie. Damit kann die Sandbox per API gesteuert werden, ohne dass Qt die Simulationslogik direkt kennt.

Diese Schichten stellen eine klare CA-Modellierung mit lokalem Update-Stencil, eine r?umliche Darstellung im Sandbox-Plot sowie eine API/Qt-basierte Steuerung bereit.

## Running the sandbox from Jupyter

Start the sandbox animation directly in the notebook by calling `run_sandbox(...)`. Example:

```
run_sandbox(frames=200, floor_profile=FloorProfile.SLOPE, floor_min=3, floor_max=12, mix_ratio=0.75)
```

This invocation uses the `slope` floor profile and runs 200 frames; adjust `floor_min` and `floor_max` to control the shallowest and deepest terrain columns, and `mix_ratio` to shift the fine/coarse balance. A metric summary is printed once the animation reaches the final frame.

## Floor profile options

The notebook helpers (`run_sandbox`, `create_engine`) accept the same `FloorProfile` choices `random`, `flat`, `slope`, and `stepped`. Each profile controls how the ground is shaped before sand is emitted:

- `random`: heights are drawn uniformly between `floor_min` and `floor_max`.
- `flat`: every column has the same height (`floor_min`).
- `slope`: heights interpolate from `floor_min` to `floor_max` across the grid width.
- `stepped`: the terrain alternates between bands of low and high columns to emulate terraces.

Set `floor_max` if you want to limit the depth; when omitted it defaults to roughly half the grid height.
