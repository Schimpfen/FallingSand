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

 10 - 20 Seiten / keine Ganzen Code Blcöke in der Docu



Person 1: Fachliches Konzept (Höller Maximmilian)

Kurze Recherche (z.B. aus „Cellular Automata.pdf“ / „Agent‑Based Modelling.pdf“),
Definition der Modellidee (Gitter, Zustände: leer/Sand/Wand/... und Regeln, wann ein Partikel fällt, rutscht etc.),
Beschreibung der Ziele und der geplanten Experimente.

Person 2: Simulationskern (Max Schimpf)

Implementierung der Datenstrukturen (Gitter, Partikelzustände),
Update‑Regeln als Algorithmus (z.B. zeilenweise Aktualisierung, Konfliktauflösung),
Performance‑Optimierungen bei Bedarf.

Person 3: Visualisierung & Interaktion (Kilian, Köck)

Darstellung der Simulation (2D‑Raster, Farben für Materialien),
Eingaben (Maus/Tastatur: Partikel „malen“, Parameter ändern),
ggf. einfache Menü‑ oder Slider‑Steuerung.

Person 4: Tests, Experimente & Dokumentation (Jonas,Höckner)

Testfälle (z.B. einfache Szenarien, in denen klar ist, wie sich das System verhalten soll),
Durchführung von Experimenten (verschiedene Parameter, Dichten, Startkonfigurationen),
Auswertung (Plots, Screenshots) und Schreiben des Berichts/Präsentation.