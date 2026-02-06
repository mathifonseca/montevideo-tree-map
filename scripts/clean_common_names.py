#!/usr/bin/env python3
"""
Limpieza de nombres comunes de especies en el dataset de árboles de Montevideo.

Aplica correcciones de:
- Nombres con coma (usar primer nombre)
- Nombres truncados
- Abreviaciones científicas → nombre común
- Capitalización
- Asignación de nombre común por nombre científico
- Corrección de nombre científico (Ginkgo bilboa → biloba)
"""

import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
CSV_PATH = PROCESSED_DIR / "arboles_montevideo_geo.csv"

# ── A. Nombres con coma (reemplazo exacto) ──────────────────────────────────

COMMA_FIXES = {
    "Gomero, F.elastica.": "Gomero",
    "Timbo,oreja de negro": "Timbó",
    "Pitanga, Ñangapiré": "Pitanga",
    "Acacia Mansa, Acacia de Bañado": "Acacia Mansa",
    "Chirca, chilca.": "Chirca",
}

# ── B. Nombres truncados (reemplazo exacto) ─────────────────────────────────

TRUNCATED_FIXES = {
    "Tuya orien.": "Tuya oriental",
    "Tuya occid.": "Tuya occidental",
    "Palo borracho amar.": "Palo borracho amarillo",
    "Pita de bordes amar.": "Pita de bordes amarillos",
    "Ligustrina borde ama": "Ligustrina borde amarillo",
    "Ligustrina borde bla": "Ligustrina borde blanco",
    "Libocedro discplinad": "Libocedro disciplinado",
    "Laurel rosa variegad": "Laurel rosa variegado",
    "Arce neg.bordes amar": "Arce negundo bordes amarillos",
    "Ciprés fúnebre stric": "Ciprés fúnebre",
    "Acokanthera spectab.": "Acokanthera",
    "Molle terebentifoliu": "Molle",
    # ── Ronda 2: truncados y nombres incorrectos ─────────────────────────
    "Sauce mimbre amarill": "Sauce dorado",
    "Ligustro disciplinad": "Ligustro variegado",
    "Cipres lamberciana": "Ciprés de Monterrey",
    "Cipres funebre horizontal": "Ciprés fúnebre horizontal",
    "Evónimo japonica": "Evónimo",
    "Ricino - Tártago": "Ricino",
    "Azarero tobira": "Azarero",
    "Aloe arboreo": "Aloe",
    "Floripón": "Floripondio",
    "Gomero bengalensis": "Ficus bengalí",
    "Roble comun": "Roble",
    "Roble palustre": "Roble de los pantanos",
    "Roble laurifolia": "Roble laurel",
    "Tilo tomentosa": "Tilo plateado",
    "Olmo glabra": "Olmo de montaña",
    # Nombre científico usado como nombre común
    "Washingtonia robusta": "Palmera washingtonia",
    "Cryptomeria japonica": "Criptomeria",
    "Callistemon linearis": "Limpiatubos",
    "Plumbago capensis": "Jazmín del cielo",
    # Variantes que deberían unificarse
    "Pindó": "Palmera pindó",
    "Fenix": "Palmera canaria",
    "Braquiciton": "Braquiquito",
    "Fco Alvarez": "Francisco Álvarez",
    "Castaño de la India": "Castaño de Indias",
}

# ── C. Abreviaciones científicas → nombre común ─────────────────────────────

ABBREVIATION_FIXES = {
    "P. radiata": "Pino radiata",
    "P.elliottii": "Pino Brasil",
    "P. halepensis": "Pino de Alepo",
    "P. nigra Italica": "Álamo piramidal",
    "P. taeda": "Pino taeda",
    "P. canariensis": "Pino canario",
    "P. nigra Thaysiana": "Álamo",
    "P. patula": "Pino patula",
    "P. Echinata": "Pino",
    "P. mugo": "Pino mugo",
    "E. globulus": "Eucalipto blanco",
    "E. camaldulensis": "Eucalipto colorado",
    "E. robusta": "Eucalipto robusto",
    "E. tereticornis": "Eucalipto rojo",
    "E. cinerea": "Eucalipto plateado",
    "E. botryoides": "Eucalipto",
    "E. grandis": "Eucalipto grandis",
    "E. saligna": "Eucalipto",
    "E. cam.var acuminata": "Eucalipto colorado",
    "E. x trabutii": "Eucalipto",
    "E. citriodora": "Eucalipto limón",
    "E cinerea x globulus": "Eucalipto",
    "S. elegantissima": "Sauce llorón dorado",
    "A. platanoides": "Arce noruego",
    "A. podalyriifolia": "Acacia podalyriifolia",
    "A. baileyana": "Acacia baileyana",
    "A. mearnsii": "Acacia negra",
    "A. verticillata": "Acacia verticillata",
    "A. cunninghamii": "Araucaria",
    "J. comunnis": "Enebro",
    "J. chinensis": "Junípero chino",
    "Ch.lawsoniana": "Ciprés de Lawson",
    "C.microphylla": "Cotoneaster",
    "Citrus sp.": "Cítrico",
    "Cedrón A. gratissima": "Cedrón",
    "Gomero-A. del caucho": "Gomero",
    "Malvón-M. Hiedra": "Malvón hiedra",
}

# ── D. Capitalización y acentos ──────────────────────────────────────────────

CAPITALIZATION_FIXES = {
    "pino marítimo": "Pino marítimo",
    # Normalización de acentos (nombres del censo original sin tildes)
    "Paraiso": "Paraíso",
    "Platano": "Plátano",
    "Jacaranda": "Jacarandá",
    "Sauce lloron": "Sauce llorón",
    "Alamo blanco": "Álamo blanco",
    "Alamo de la Carolina": "Álamo de la Carolina",
    "Alamo Carolino": "Álamo Carolino",
    "Alamo piramidal": "Álamo piramidal",
    "Alamo plateado": "Álamo plateado",
    "Alamo híbrido": "Álamo híbrido",
    "Timbo": "Timbó",
    # ── Ronda 2: acentos faltantes ───────────────────────────────────────
    "Arbol del Cielo": "Árbol del cielo",
    "Nispero": "Níspero",
    "Ibirapita": "Ibirapitá",
    "Falsa Mandioca": "Falsa mandioca",
    "Cipres calvo": "Ciprés calvo",
    "Cipres glauco": "Ciprés glauco",
    "Palan Palan": "Palán palán",
    "Palmera Washingtonia": "Palmera washingtonia",
    "Butia": "Butiá",
    "Olmo americana": "Olmo americano",
    "Sauce electrico": "Sauce eléctrico",
}

# ── E. Nombre científico → nombre común (para registros sin nombre) ─────────

SCIENTIFIC_TO_COMMON = {
    "Fraxinus lanceolata": "Fresno americano",
    "Melia azedarach": "Paraíso",
    "Platanus x acerifolia": "Plátano de sombra",
    "Tipuana tipu": "Tipa",
    "Schinus molle": "Anacahuita",
    "Acer negundo": "Arce negundo",
    "Fraxinus excelsior": "Fresno europeo",
    "Nerium oleander": "Laurel rosa",
    "Jacaranda ovalifolia": "Jacarandá",
    "Eucalyptus globulus ssp globulus": "Eucalipto blanco",
    "Populus deltoides": "Álamo Carolino",
    "Acer saccharinum": "Arce plateado",
    "Salix babylonica": "Sauce llorón",
    "Chorisia speciosa": "Palo borracho rosa",
    "Salix elegantissima": "Sauce llorón dorado",
    "Ligustrum lucidum": "Ligustro",
    "Ulmus procera": "Olmo europeo",
    "Taxodium distichum": "Ciprés calvo",
    "Catalpa bignonioides": "Catalpa",
    "Hibiscus rosa-sinensis": "Rosa de la China",
    "Dudas": "Sin identificar",
    "Phoenix canariensis": "Palmera canaria",
    "Casuarina cunninghamiana": "Pino australiano",
    "Manihot flabellifolia": "Falsa mandioca",
    "Salix sp.": "Sauce criollo",
    "Seco": "Ejemplar seco",
    "Populus alba": "Álamo blanco",
    "Liquidambar styraciflua": "Liquidambar",
    "Hibiscus syriacus": "Rosa de Siria",
    "Tilia moltkei": "Tilo moltkei",
    # Grupo 2
    "Myoporum laetum": "Siempreverde",
    "Grevillea robusta": "Grevillea",
    "Peltophorum dubium": "Ibirapitá",
    "Erythrina crista-galli": "Ceibo",
    "Eucalyptus camaldulensis": "Eucalipto colorado",
    "Firmiana simplex": "Parasol de la China",
    "Salix alba": "Sauce blanco",
    "Salix humboldtiana": "Sauce criollo",
    "Ficus elastica": "Gomero",
    "Arecastrum romanzoffianum": "Palmera pindó",
    "Prunus cerasifera var. pissardii": "Ciruelo rojo",
    "Pinus pinaster": "Pino marítimo",
    "Enterolobium contortisiliquum": "Timbó",
    "Robinia pseudoacacia": "Acacia blanca",
    "Cupressus sempervirens": "Ciprés mediterráneo",
    "Cordyline australis": "Drácena",
    "Morus alba": "Morera",
    "Platanus occidentalis": "Plátano",
    "Washingtonia robusta": "Palmera washingtonia",
    "Quercus robur": "Roble",
    "Fraxinus americana": "Fresno americano",
    "Tabebuia impetiginosa": "Lapacho rosado",
    "Juglans nigra": "Nogal negro",
    "Persea americana": "Palto",
    "Ulmus americana": "Olmo americano",
    "Eucalyptus spp.": "Eucalipto",
    "Eucalyptus robusta": "Eucalipto robusto",
    "Ginkgo biloba": "Ginkgo",
    "Ginkgo bilboa": "Ginkgo",
    "Eucalyptus tereticornis": "Eucalipto rojo",
    "Acacia dealbata": "Aromo",
    "Phytolacca dioica": "Ombú",
    "Ailanthus altissima": "Árbol del cielo",
    # ── Restantes (especies con 30-150 árboles sin nombre común) ─────────
    "Acacia melanoxylon": "Acacia negra",
    "Araucaria angustifolia": "Araucaria",
    "Araucaria bidwillii": "Araucaria bidwillii",
    "Bauhinia candicans": "Pata de vaca",
    "Brachychiton populneum": "Braquiquito",
    "Butia capitata": "Butiá",
    "Callistemon lanceolatus": "Limpiatubos",
    "Cedrus deodara": "Cedro del Himalaya",
    "Celtis australis": "Almez",
    "Celtis spinosa": "Tala",
    "Ceratonia siliqua": "Algarrobo europeo",
    "Cinnamomum glanduliferum": "Falso alcanfor",
    "Citrus aurantium": "Naranjo amargo",
    "Citrus limon": "Limonero",
    "Cryptomeria japonica": "Criptomeria",
    "Cupressus arizonica": "Ciprés de Arizona",
    "Cupressus lusitanica": "Cedro blanco",
    "Cupressus macrocarpa": "Ciprés de Monterrey",
    "Eriobotrya japonica": "Níspero",
    "Erythrina falcata": "Ceibo de monte",
    "Eugenia uniflora": "Pitanga",
    "Feijoa sellowiana": "Guayabo del país",
    "Ficus benjamina": "Ficus",
    "Fraxinus ornus": "Fresno de flor",
    "Fraxinus pennsylvanica": "Fresno americano",
    "Gleditsia triacanthos": "Acacia tres espinas",
    "Ilex aquifolium": "Acebo",
    "Jacaranda mimosifolia": "Jacarandá",
    "Koelreuteria paniculata": "Jabonero de la China",
    "Lagerstroemia indica": "Crespón",
    "Laurus nobilis": "Laurel",
    "Ligustrum japonicum": "Ligustrina",
    "Ligustrum sinense": "Ligustrina china",
    "Magnolia grandiflora": "Magnolia",
    "Malus domestica": "Manzano",
    "Morus nigra": "Morera negra",
    "Olea europaea": "Olivo",
    "Parkinsonia aculeata": "Cina-cina",
    "Phoenix dactylifera": "Palmera datilera",
    "Pinus halepensis": "Pino de Alepo",
    "Pinus patula": "Pino patula",
    "Pinus radiata": "Pino radiata",
    "Pinus taeda": "Pino taeda",
    "Pittosporum tobira": "Azarero",
    "Populus nigra var. italica": "Álamo piramidal",
    "Prunus domestica": "Ciruelo",
    "Prunus laurocerasus": "Lauroceraso",
    "Prunus persica": "Duraznero",
    "Psidium cattleianum": "Arazá",
    "Punica granatum": "Granado",
    "Pyracantha coccinea": "Crataegus",
    "Pyrus communis": "Peral",
    "Quercus palustris": "Roble de los pantanos",
    "Schinus longifolius": "Molle",
    "Sesbania punicea": "Acacia de bañado",
    "Sophora japonica": "Sófora",
    "Syagrus romanzoffiana": "Palmera pindó",
    "Thuja occidentalis": "Tuya occidental",
    "Thuja orientalis": "Tuya oriental",
    "Tilia cordata": "Tilo de hoja chica",
    "Trachycarpus fortunei": "Palmera china",
    "Ulmus pumila": "Olmo siberiano",
    "Viburnum tinus": "Laurentino",
    "Vitex agnus-castus": "Sauzgatillo",
    # ── Restantes adicionales (especies con árboles sin nombre común) ────
    "Washingtonia filifera": "Palmera washingtonia",
    "Salix alba cv 'Vitelina'": "Sauce dorado",
    "Populus x euroamericana": "Álamo euroamericano",
    "Bahuinia candicans": "Pata de vaca",
    "Ligustrum ovalifolium": "Ligustrina",
    "Yucca gloriosa": "Yuca",
    "Acer campestre": "Arce campestre",
    "Agave americana": "Pita",
    "Citrus sp.": "Cítrico",
    "Hovenia dulcis": "Uva del Japón",
    "Acacia longifolia": "Acacia trinervis",
    "Hibiscus mutabilis": "Rosa loca",
    "Eucalyptus botryoides": "Eucalipto",
    "Rosa sp.": "Rosal",
    "Olea europea": "Olivo",
    "Cupressus semp.var Stricta": "Ciprés mediterráneo",
    "Cupressus spp.": "Ciprés",
    "Pinus elliottii": "Pino Brasil",
    "Populus nigra cv Italica": "Álamo piramidal",
    "Pinus sp.": "Pino",
    "Chaenomeles lagenaria": "Membrillero japonés",
    "Juglans regia": "Nogal real",
    "Aloe arborescens": "Aloe",
    "Ligustrum lucidum var aureo marginatum": "Ligustro variegado",
    "Yucca aloifolia": "Yuca",
    "Agave americana var. marginata": "Pita de bordes amarillos",
    "Nerium oleander var. variegatum": "Laurel rosa variegado",
    "Liriodendron tulipifera": "Tulipanero",
    "Euphorbia pulcherrima": "Estrella federal",
    "Cotoneaster pannosa": "Cotoneaster",
    "Acacia sp.": "Acacia",
    "Populus sp": "Álamo",
    "Malvaviscus arboreus var pendula": "Farolito japonés",
    "Tabebuia pulcherrima": "Lapacho amarillo",
    "Datura arbórea": "Floripondio",
    "Aesculus hippocastanum": "Castaño de Indias",
    "Pinus pinea": "Pino piñonero",
    "Fraxinus lanceolata cv. Juglandifolia": "Fresno americano",
    "Pinus canariensis": "Pino canario",
    "Populus nigra": "Álamo negro",
    "Acacia caven": "Espinillo",
    "Ligustrum ovalifolium aurea marginatum": "Ligustrina variegada",
    "Strelitzia nicolai": "Ave del paraíso gigante",
    "Quercus borealis": "Roble rojo",
    "Acer platanoides": "Arce noruego",
    "Dracaena draco": "Drago",
    "Paulownia tomentosa": "Kiri",
    "Luehea divaricata": "Francisco Álvarez",
    "Lantana camara": "Lantana",
    "Clivia miniata": "Clivia",
    "Casuarina equisetifolia": "Casuarina",
    "Acer sp": "Arce",
    "Eucalyptus camaldulensis var.acuminata": "Eucalipto colorado",
    "Callistemon linearis": "Limpiatubos",
    "Populus nigra cv Thaysiana": "Álamo",
    "Ulmus glabra": "Olmo de montaña",
    "Spiraea cantoniensis": "Corona de novia",
    "Ficus carica": "Higuera",
    "Butia yatay": "Yatay",
    "Carya illinoensis": "Pecán",
    "Quercus bicolor": "Roble bicolor",
    "Salix x erythroflexuosa": "Sauce tortuoso",
    "Spartium junceum": "Retama",
    "Acacia baileyana": "Acacia baileyana",
    "Araucaria heterophylla": "Araucaria excelsa",
    "Schinus lentiscifolius": "Molle rastrero",
    "Erythrina crista-galli var.leucochlora": "Ceibo",
    "Cupressus semp.var Horizontalis": "Ciprés mediterráneo",
    "Eucalyptus grandis": "Eucalipto grandis",
    "Aesculus carnea": "Castaño de Indias rojo",
    "Calliandra tweedii": "Plumerillo rojo",
    "Evonymus japonica": "Evónimo",
    "Quercus macrocarpa": "Roble",
    "Citharexylum montevidense": "Tarumán",
    "Chorisia insignis": "Palo borracho amarillo",
    "Quercus laurifolia": "Roble laurel",
    "Eucalyptus cinerea": "Eucalipto plateado",
    "Populus alba var. pyramidalis": "Álamo blanco piramidal",
    "Populus alba var subintegerrima": "Álamo blanco",
    "Tilia tomentosa": "Tilo plateado",
    "Abelia grandiflora": "Abelia",
    "Pittosporum undulatum": "Pitósporo",
    "Cinnamomun camphora": "Alcanfor",
    "Vitis sp.": "Vid",
    "Maclura pomifera": "Naranjo de Luisiana",
    "Plumbago capensis": "Jazmín del cielo",
    "Ficus bengalensis": "Ficus bengalí",
    "Ligustrum ovalifolium albo marginatum": "Ligustrina variegada",
    "Eucalyptus ficifolia": "Eucalipto rojo de flores",
    "Quercus ilex": "Encina",
    "Castanea sativa": "Castaño",
    "Abutilon molle": "Abutilón",
    "Phormium tenax": "Formio",
    "Casuarina stricta": "Casuarina",
    "Juniperus chinensis": "Junípero chino",
    "Acer pseudoplatanus": "Arce sicómoro",
    "Callistemon citrinus": "Limpiatubos",
    "Populus canescens": "Álamo gris",
    "Cyca revoluta": "Cica",
    "Kolreuteria paniculata": "Jabonero de la China",
    "Evonymus japonica aureo-marginatum": "Evónimo variegado",
    "Malus sp.": "Manzano",
    "Schinus terebenthifolius": "Aroeira",
    "Brunfelsia australis": "Jazmín paraguayo",
    "Scutia buxifolia": "Coronilla",
    "Aloe ciliaris": "Aloe",
    "Prunus communis": "Almendro",
    "Eucalyptus saligna": "Eucalipto",
    "Styphnolobium japonicum": "Sófora",
    "Blepharocalyx tweediei": "Arrayán",
    "Nicotiana glauca": "Palán palán",
    "Aloe saponaria": "Aloe",
    "Juniperus sabina": "Sabina",
    "Cordyline stricta": "Drácena",
    "Philodendron undulatum": "Filodendro",
    "Acer negundo var argenteo variegatum": "Arce negundo variegado",
    "Ficus elastica var. decora": "Gomero",
    "Acca sellowiana": "Guayabo del país",
    "Pittosporum tobira var variegata": "Azarero variegado",
    "Melia azedarach variegata": "Paraíso variegado",
    "Cercis siliquastrum": "Árbol de Judea",
    "Elaeagnus angustifolia": "Árbol del paraíso",
    "Psidium guajava": "Guayabo",
    "Inga uruguensis": "Ingá",
    "Myrcianthes cisplatensis": "Guayabo colorado",
    "Bougainvillea glabra": "Santa Rita",
    "Cupressus funebris": "Ciprés fúnebre",
    "Cedrus atlantica": "Cedro del Atlas",
    "Acer palmatum": "Arce japonés",
    "Magnolia liliflora": "Magnolia liliflora",
    "Musa sp.": "Bananero",
    "Albizzia julibrissin": "Acacia de Constantinopla",
    "Gleditsia amorphoides": "Espina de corona",
    "Betula pendula": "Abedul",
    "Broussonetia papyrifera": "Morera de papel",
    "Camelia japonica": "Camelia",
    "Tamarix pentandra": "Tamarisco",
    "Ricinus comunnis": "Ricino",
    "Chamaerops humile": "Palmito",
    "Lonchocarpus nitidus": "Rabo de lagarto",
    "Crataegus oxyacantha": "Espino albar",
    # ── Especies con pocos registros (ronda final) ─────────────────────────
    "Ruscus hypoglosum": "Ruscus",
    "Ficus luschnatiana": "Higuerón",
    "Calliandra parvifolia": "Plumerillo",
    "Evonymus japonica var. aurea": "Evónimo variegado",
    "Cinnamomum zeylanicum": "Canelo",
    "Baccharis spicata": "Chirca",
    "Jasminum mesnyi": "Jazmín amarillo",
    "Myrrhinium loranthoides": "Palo de fierro",
    "Monstera deliciosa": "Costilla de Adán",
    "Evonymus japonica v.albo marginatum": "Evónimo variegado",
    "Poecilanthe parvifolia": "Lapachillo",
    "Agathis robusta": "Damara",
    "Eucalyptus x trabutii": "Eucalipto",
    "Cupressus torulosa": "Ciprés del Himalaya",
    "Euphorbia milii": "Corona de Cristo",
    "Jasminum azoricum": "Jazmín de las Azores",
    "Morus multicaulis": "Morera multicaule",
    "Pinus echinata": "Pino",
    "Populus alba var. nivea": "Álamo blanco",
    "Juniperus communis": "Enebro",
    "Berberis thunbergii var. atropurpurea": "Berberis purpura",
    "Juniperus squamata": "Junípero rastrero",
    "Evonymus hamiltonianus": "Evónimo hamiltoniano",
    "Prunus spp.": "Prunus",
    "Pelargonium spp": "Malvón",
    "Quercus phellos": "Roble de los pantanos",
    "Cestrum nocturnum": "Dama de la noche",
    "Wisteria sinensis": "Glicina",
    "Juglans australis": "Nogal criollo",
    "Acacia horrida": "Acacia",
    "Furcraea sp.": "Furcraea",
    "Weigela florida": "Weigela",
    "Cotoneaster lactea": "Cotoneaster",
    "Berberis thunbergii": "Berberis",
    "Cotyledon sp": "Crasa",
    "Tilia platyphyllos": "Tilo platifilo",
    "Alnus glutinosa": "Aliso común",
    "Aloysia triphylla": "Cedrón",
    "Salix babylonica var annularis": "Sauce crespo",
    "Archontophoenix cunninghamiana": "Seafortia",
    "Acacia mearnsii": "Acacia negra",
    "Quillaja brasiliensis": "Palo de jabón",
    "Solanum sp.": "Solanum",
    "Eucalyptus sideroxylon": "Eucalipto",
    "Campsis radicans": "Trompeta de fuego",
    "Eucalyptus viminalis": "Eucalipto",
    "Cassia bicapsularis": "Cañafístula",
    "Cyperus papyrus": "Papiro",
    "Casuarina glauca": "Casuarina glauca",
    "Eucalyptus globulus ssp pseudoglobulus": "Eucalipto blanco",
    "Lithraea brasiliensis": "Aruera",
    "Pterocarya rehderiana": "Pterocarya",
    "Cotoneaster glaucophylla serotina": "Cotoneaster",
    "Rapanea laetevirens": "Canelón",
    "Jasminum humile": "Jazmín amarillo",
    "Elaeagnus pungens": "Elaeagnus pungens",
    "Crataegus oxyacantha var. rosea": "Espino albar",
    "Viburnum henryi": "Viburno henryi",
    "Callistemon salignus": "Limpiatubos",
    "Asparagus plumosus": "Helecho espárrago",
    "Eucalyptus diversicolor": "Eucalipto",
    "Acacia bonariensis": "Ñapindá",
    "Gardenia jasminoides": "Jazmín del Cabo",
    "Hedera helix": "Hiedra",
    "Jasminum officinale": "Jazmín",
    "Phormium tenax var variegata": "Formio variegado",
    "Hydrangea macrophylla": "Hortensia",
    "Morus alba var. tartarica": "Morera",
    "Jasminum officinale var.grandiflorum": "Jazmín",
    "Taxodium mucronatum": "Ciprés calvo (mex)",
    "Prunus glandulosa": "Cerezo de flor",
    "Aloysia gratissima": "Cedrón del monte",
    "Acacia visco": "Visco",
    "Eucalyptus citriodora": "Eucalipto limón",
    "Colletia paradoxa": "Espina de la cruz",
    "Chaenomeles sinensis": "Membrillero chino",
    "Cocculus laurifolius": "Cocculus",
    "Gardenia thunbergia": "Gardenia",
    "Adhatoda vasica": "Adhatoda vasica",
    "Prunus avium": "Cerezo",
    "Rhaphiolepis umbellata": "Raphiolepis",
    "Photinia serrulata": "Fotinia",
    "Fagara rhoifolia": "Tembetarí",
    "Solanum mauritianum": "Fumo bravo",
    "Pyracantha angustifolia": "Crataegus",
    "Myrcianthes pungens": "Guabiyú",
    "Abies pinsapo": "Pinsapo",
    "Philadelphus coronarius": "Celinda",
    "Juniperus drupacea": "Enebro de Siria",
    "Eucalyptus diversifolia": "Eucalipto",
    "Myrceugenia glaucescens": "Murta",
    "Eucalyptus maculata": "Eucalipto",
    "Cephalotaxus harringtonia": "Tejo japonés",
    "Quercus suber": "Alcornoque",
    "Doryalis caffra": "Ciruela cafre",
    "Clivia nobilis": "Clivia",
    "Cereus sp.": "Cactus",
    "Cotoneaster microphylla": "Cotoneaster",
    "Pittosporum crassifolium": "Pitósporo",
    "Casuarina torulosa": "Casuarina",
    "Pereskia grandiflora": "Rosa del desierto",
    "Leptospermum sp.": "Leptospermum",
    "Calocedrus decurrens": "Libocedro",
    "Diospyros kaki": "Caqui",
    "Carpinus betulus": "Carpino",
    "Patagonula americana": "Guayubira",
    "Lonicera japonica": "Madreselva",
    "Castanospermum australe": "Castanospermo",
    "Buxus sempervirens": "Boj",
    "Ficus elastica variegado": "Gomero variegado",
    "Sapium linearifolium": "Curupí",
    "Opuntia sp.": "Chumbera",
    "Viburnum suspensum": "Viburno",
    "Maytenus ilicifolia": "Congorosa",
    "Acacia verticillata": "Acacia verticillata",
    "Ulmus glabra var argentea": "Olmo de montaña",
    "Phoenix paludosa": "Fénix paludosa",
    "Arbutus unedo": "Madroño",
    "Juniperus virginiana": "Cedro rojo",
    "Juniperus virginiana var albo spicata": "Cedro rojo variegado",
    "Strelitzia reginae": "Ave del paraíso",
    "Ulmus procera var pendula": "Olmo péndulo",
    "Cedrus deodara f.pendula": "Cedro del Himalaya péndulo",
    "Guettarda uruguensis": "Jazmín del Uruguay",
    "Eucalyptus cornuta": "Eucalipto",
    "Olea laurifolia": "Olivo",
    "Lithraea molleoides": "Molle de beber",
    "Crataegus monogyna": "Espino albar",
    "Thuja plicata": "Tuya plicata",
    "Pittosporum eugenioides": "Pitósporo",
    "Alnus cordata": "Aliso hoja cordada",
    "Pittosporum tenuifolium": "Pitósporo",
    "Livistona chinensis": "Latania",
    "Austrocedrus chilensis": "Ciprés de la cordillera",
    "Cortaderia selloana": "Paja penacho",
    "Eucalyptus gomphocephala": "Eucalipto",
    "Sequoia sempervirens": "Secuoya",
    "Eucalyptus amplifolia": "Eucalipto",
    "Phoenix reclinata": "Palmera de Senegal",
    "Mirabilis jalapa": "Don Diego de la noche",
    "Parapiptadenia rigida": "Angico",
    "Senecio mikanioides": "Hiedra alemana",
    "Thevetia peruviana": "Thevetia",
    "Ficus macrophylla": "Ficus",
    "Crataegus pubescens": "Tejocote",
    "Cassia multijuga": "Cañafístula",
    "Sapium sp.": "Curupí",
    "Phyllostachys aurea": "Bambú dorado",
    "Acacia podalyriifolia": "Acacia podalyriifolia",  # nombre científico = nombre común
}


# ── G. Unificación de nombres comunes (por nombre científico) ────────────────

UNIFY_NAMES = {
    # Grupo A — alto impacto
    "Platanus x acerifolia": "Plátano de sombra",
    "Nerium oleander": "Laurel rosa",
    "Ulmus procera": "Olmo europeo",
    "Acer saccharinum": "Arce plateado",
    "Populus deltoides": "Álamo Carolino",
    "Hibiscus rosa-sinensis": "Rosa de la China",
    "Tilia moltkei": "Tilo moltkei",
    "Populus alba": "Álamo blanco",
    # Grupo B — impacto medio
    "Erythrina crista-galli": "Ceibo",
    "Casuarina cunninghamiana": "Pino australiano",
    "Hibiscus syriacus": "Rosa de Siria",
    "Grevillea robusta": "Grevillea",
    "Myoporum laetum": "Siempreverde",
    "Prunus cerasifera var. pissardii": "Ciruelo rojo",
    "Cupressus sempervirens": "Ciprés mediterráneo",
    "Cupressus semp.var Stricta": "Ciprés mediterráneo",
    "Persea americana": "Palto",
    "Populus x euroamericana": "Álamo euroamericano",
    "Lagerstroemia indica": "Crespón",
    "Acacia dealbata": "Aromo",
    "Juglans regia": "Nogal real",
    # Grupo C — bajo impacto
    "Agave americana": "Pita",
    "Fraxinus ornus": "Fresno de flor",
    "Gleditsia triacanthos": "Acacia tres espinas",
    "Acacia melanoxylon": "Acacia negra",
    "Hovenia dulcis": "Uva del Japón",
    "Rosa sp.": "Rosal",
    "Chaenomeles lagenaria": "Membrillero japonés",
    "Hibiscus mutabilis": "Rosa loca",
    "Parkinsonia aculeata": "Cina-cina",
    "Cupressus lusitanica": "Cedro blanco",
    "Quercus borealis": "Roble rojo",
    "Malvaviscus arboreus var pendula": "Farolito japonés",
    # Variantes relacionadas
    "Nerium oleander var. variegatum": "Laurel rosa variegado",
    "Agave americana var. marginata": "Pita de bordes amarillos",
    "Erythrina crista-galli var.leucochlora": "Ceibo",
    "Cupressus semp.var Horizontalis": "Ciprés mediterráneo",
}


# ── H. Corrección de nombres científicos mal escritos ────────────────────────

SCIENTIFIC_NAME_FIXES = {
    # Errores ortográficos comunes
    "Bahuinia candicans": "Bauhinia candicans",
    "Olea europea": "Olea europaea",
    "Ricinus comunnis": "Ricinus communis",
    "Cinnamomun camphora": "Cinnamomum camphora",
    "Cinnamomun zeylanicum": "Cinnamomum zeylanicum",
    "Pyrus comunnis": "Pyrus communis",
    "Kolreuteria paniculata": "Koelreuteria paniculata",
    "Berberis thumbergii": "Berberis thunbergii",
    "Berberis thumbergii var atropurpurea": "Berberis thunbergii var. atropurpurea",
    "Pterocarya redheriana": "Pterocarya rehderiana",
    "Sequioa sempervirens": "Sequoia sempervirens",
    "Dyospiros kaki": "Diospyros kaki",
    "Castanospermun australe": "Castanospermum australe",
    "Cortaderia seloana": "Cortaderia selloana",
    "Psidium catleianum": "Psidium cattleianum",
    "Hydrangea macrophyla": "Hydrangea macrophylla",
    "Chaenomeles cinensis": "Chaenomeles sinensis",
    "Quercus phelox": "Quercus phellos",
    "Leptospermun sp.": "Leptospermum sp.",
    "Pittosporum crasifolium": "Pittosporum crassifolium",
    "Raphiolepis umbellata": "Rhaphiolepis umbellata",
    "Cotoneaster glaucophilla serotina": "Cotoneaster glaucophylla serotina",
    "Crateagus oxyacantha var.rosea": "Crataegus oxyacantha var. rosea",
    "Datura arbórea": "Datura arborea",  # sin tilde en nombres científicos
    "Sapium sp..": "Sapium sp.",  # punto extra
    # Ginkgo ya corregido en paso F, pero por si acaso
    "Ginkgo bilboa": "Ginkgo biloba",
}


def main():
    print("Cargando datos...")
    df = pd.read_csv(CSV_PATH, low_memory=False)
    total = len(df)
    print(f"Total árboles: {total:,}")

    sin_nombre_antes = df["Nombre común"].isna().sum()
    print(f"Sin nombre común antes: {sin_nombre_antes:,}")

    # ── H. Corrección de nombres científicos ─────────────────────────────
    count_h = 0
    for old, new in SCIENTIFIC_NAME_FIXES.items():
        mask = df["Nombre científico"] == old
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre científico"] = new
            count_h += n
            print(f"  '{old}' → '{new}': {n}")
    print(f"Correcciones nombres científicos: {count_h:,}")

    # ── A. Nombres con coma ──────────────────────────────────────────────
    count_a = 0
    for old, new in COMMA_FIXES.items():
        mask = df["Nombre común"] == old
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre común"] = new
            count_a += n
            print(f"  '{old}' → '{new}': {n}")
    print(f"Correcciones coma: {count_a:,}")

    # ── B. Nombres truncados ─────────────────────────────────────────────
    count_b = 0
    for old, new in TRUNCATED_FIXES.items():
        mask = df["Nombre común"] == old
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre común"] = new
            count_b += n
            print(f"  '{old}' → '{new}': {n}")
    print(f"Correcciones truncados: {count_b:,}")

    # ── C. Abreviaciones científicas ─────────────────────────────────────
    count_c = 0
    for old, new in ABBREVIATION_FIXES.items():
        mask = df["Nombre común"] == old
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre común"] = new
            count_c += n
            print(f"  '{old}' → '{new}': {n}")
    print(f"Correcciones abreviaciones: {count_c:,}")

    # ── D. Capitalización ────────────────────────────────────────────────
    count_d = 0
    for old, new in CAPITALIZATION_FIXES.items():
        mask = df["Nombre común"] == old
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre común"] = new
            count_d += n
            print(f"  '{old}' → '{new}': {n}")
    print(f"Correcciones capitalización: {count_d:,}")

    # ── E. Asignar nombre común por nombre científico ────────────────────
    count_e = 0
    sin_nombre = df["Nombre común"].isna()
    for sci_name, common_name in SCIENTIFIC_TO_COMMON.items():
        mask = sin_nombre & (df["Nombre científico"] == sci_name)
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre común"] = common_name
            count_e += n
            print(f"  {sci_name} → '{common_name}': {n}")
            # Update the mask after assignment
            sin_nombre = df["Nombre común"].isna()
    print(f"Asignaciones por nombre científico: {count_e:,}")

    # ── G. Unificación de nombres comunes ──────────────────────────────
    # Combinar UNIFY_NAMES con SCIENTIFIC_TO_COMMON para corregir data entry errors
    all_mappings = {**SCIENTIFIC_TO_COMMON, **UNIFY_NAMES}  # UNIFY_NAMES tiene prioridad

    count_g = 0
    for sci_name, common_name in all_mappings.items():
        mask = (df["Nombre científico"] == sci_name) & (
            df["Nombre común"].isna() | (df["Nombre común"] != common_name)
        )
        n = mask.sum()
        if n > 0:
            df.loc[mask, "Nombre común"] = common_name
            count_g += n
            print(f"  {sci_name} → '{common_name}': {n}")
    print(f"Unificaciones (data entry fixes): {count_g:,}")

    # ── Resumen ──────────────────────────────────────────────────────────
    sin_nombre_despues = df["Nombre común"].isna().sum()
    print(f"\n{'='*60}")
    print(f"Sin nombre común antes:   {sin_nombre_antes:,}")
    print(f"Sin nombre común después: {sin_nombre_despues:,}")
    print(f"Nombres asignados:        {sin_nombre_antes - sin_nombre_despues:,}")
    print(f"Total correcciones:       {count_h + count_a + count_b + count_c + count_d + count_e + count_g:,}")

    # ── Guardar ──────────────────────────────────────────────────────────
    print(f"\nGuardando en {CSV_PATH}...")
    df.to_csv(CSV_PATH, index=False)
    print("Listo.")


if __name__ == "__main__":
    main()
