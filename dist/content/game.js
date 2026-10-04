// Prepared from the supplied character sheets: numeric dots only. Player descriptions, ages, sire fields, backgrounds, specialties, Computer, Drive and Streetwise have been excluded.
export const gameContent = {
  "schemaVersion": 2,
  "title": "ИГРА",
  "chronology": "Сентябрь 1917 года",
  "draft": false,
  "house": {
    "title": "Особняк",
    "image": {
      "src": "assets/manor.png",
      "alt": "Старая усадьба среди осеннего сада",
      "position": "50% 54%"
    },
    "caption": "Особняк · вид с парка",
    "intro": "",
    "history": ""
  },
  "days": [
    {
      "id": "day-01",
      "title": "Ночь первая",
      "dateLabel": "Сентябрь 1917",
      "period": "Перед ужином",
      "intro": "",
      "draft": true
    },
    {
      "id": "day-02",
      "title": "Ночь вторая",
      "dateLabel": "Сентябрь 1917",
      "period": "Поздний вечер",
      "intro": "",
      "draft": true
    },
    {
      "id": "day-03",
      "title": "Ночь третья",
      "dateLabel": "Сентябрь 1917",
      "period": "После полуночи",
      "intro": "",
      "draft": true
    },
    {
      "id": "day-04",
      "title": "Ночь четвёртая",
      "dateLabel": "Сентябрь 1917",
      "period": "Глубокая ночь",
      "intro": "",
      "draft": true
    },
    {
      "id": "day-05",
      "title": "Ночь пятая",
      "dateLabel": "Сентябрь 1917",
      "period": "Перед рассветом",
      "intro": "",
      "draft": true
    }
  ],
  "characters": [
    {
      "id": "character-01",
      "name": "Алексей Сергеевич Оболенский",
      "clan": "Вентру",
      "affiliation": "Камарилья",
      "generation": "10",
      "nature": "Автократ",
      "demeanor": "Традиционалист",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 0,
        "alt": "Портрет: Алексей Сергеевич Оболенский"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 2
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 2
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 2
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 3
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 5
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 3
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 2
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 3
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 3
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "expression",
          "name": "Экспрессия",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "leadership",
          "name": "Лидерство",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "etiquette",
          "name": "Этикет",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "firearms",
          "name": "Огнестрельное оружие",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "melee",
          "name": "Ближний бой",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "performance",
          "name": "Исполнение",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "law",
          "name": "Закон",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 3,
          "group": "Знания"
        }
      ],
      "disciplines": [
        {
          "name": "Доминирование",
          "value": 2
        },
        {
          "name": "Величие",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 3
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 4
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 8,
      "bloodPool": 7,
      "curse": "Проклятие клана: может пить кровь только стройных девушек.",
      "goals": {
        "main": {
          "personal": "Сохранить честь и достоинство офицера, не прибегая к грязным трюкам и предательству.",
          "game": "В конце должно остаться больше камарильцев, чем анархов. Можно убеждать игроков сменить позицию."
        },
        "traitor": "Все анархи должны быть уничтожены."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-02",
      "name": "Иван Александрович Чернов",
      "clan": "Гангрелы ",
      "affiliation": "Независимый",
      "generation": "12-е",
      "nature": "Борец",
      "demeanor": "Одиночка",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 1,
        "alt": "Портрет: Иван Александрович Чернов"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 3
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 3
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 5
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 2
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 2
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 2
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 3
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 2
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 3
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "athletics",
          "name": "Атлетика",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "brawl",
          "name": "Драка",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "animalken",
          "name": "Знание животных",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "melee",
          "name": "Ближний бой",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 3,
          "group": "Знания"
        },
        {
          "key": "medicine",
          "name": "Медицина",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "occult",
          "name": "Оккультизм",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "dodge",
          "name": "Уклонение",
          "value": 3,
          "group": "Таланты"
        }
      ],
      "disciplines": [
        {
          "name": "Превращение",
          "value": 3
        },
        {
          "name": "Анимализм",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 3
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 3
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 4
        }
      ],
      "humanity": 6,
      "willpower": 5,
      "bloodPool": 7,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Выжить или сбежать из игры.",
          "game": "Мы нашли гончую «Муську», которую ты когда-то потерял. Нужно привести её живой на голосование в пятую ночь."
        },
        "traitor": "Принести другого игрока в жертву на лесном алтаре."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-03",
      "name": "Катя Лукина",
      "clan": "Бруха (Смутьяны)",
      "affiliation": "Камарилья",
      "generation": "11",
      "nature": "Бунтарь",
      "demeanor": "Головорез",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 2,
        "alt": "Портрет: Катя Лукина"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 3
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 4
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 3
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 4
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 2
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 2
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 3
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 2
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 2
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "athletics",
          "name": "Атлетика",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "brawl",
          "name": "Драка",
          "value": 4,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "leadership",
          "name": "Лидерство",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "animalken",
          "name": "Знание животных",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "crafts",
          "name": "Ремёсла",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "etiquette",
          "name": "Этикет",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "firearms",
          "name": "Огнестрельное оружие",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "melee",
          "name": "Ближний бой",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "law",
          "name": "Закон",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "occult",
          "name": "Оккультизм",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "dodge",
          "name": "Уклонение",
          "value": 2,
          "group": "Таланты"
        }
      ],
      "disciplines": [
        {
          "name": "Стремительность",
          "value": 2
        },
        {
          "name": "Мощь",
          "value": 1
        },
        {
          "name": "Величие",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 3
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 3
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 4
        }
      ],
      "humanity": 6,
      "willpower": 5,
      "bloodPool": 8,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Оставаться стойкой в любых обстоятельствах: ни разу не впасть в безумие.",
          "game": "В конце должно остаться не более одного камарильца."
        },
        "traitor": "Камарилец должен умереть вне голосования."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-04",
      "name": "Николай Викторович Воронцов",
      "clan": "Тремер",
      "affiliation": "Камарилья",
      "generation": "10",
      "nature": "Исследователь",
      "demeanor": "Перфекционист",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 3,
        "alt": "Портрет: Николай Викторович Воронцов"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 2
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 2
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 2
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 2
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 3
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 3
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 3
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 4
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 3
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "expression",
          "name": "Экспрессия",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "leadership",
          "name": "Лидерство",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "etiquette",
          "name": "Этикет",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "firearms",
          "name": "Огнестрельное оружие",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "academics",
          "name": "Академические знания",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "medicine",
          "name": "Медицина",
          "value": 3,
          "group": "Знания"
        },
        {
          "key": "occult",
          "name": "Оккультизм",
          "value": 4,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "science",
          "name": "Наука",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "linguistics",
          "name": "Лингвистика",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "security",
          "name": "Безопасность",
          "value": 1,
          "group": "Навыки"
        }
      ],
      "disciplines": [
        {
          "name": "Тауматургия",
          "value": 3
        },
        {
          "name": "Ясновидение",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 4
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 3
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 7,
      "bloodPool": 6,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Выжить или сбежать из игры.",
          "game": "Найти артефакт и принести его на собрание в пятую ночь."
        },
        "traitor": "Убить титулярного советника Фёдора Алексеевича Резника путём отравления."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-05",
      "name": "Отец Николай",
      "clan": "Ласомбра ",
      "affiliation": "Нейтрал; бывший Шабаш",
      "generation": "10",
      "nature": "Кающийся грешник",
      "demeanor": "Опекун",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 4,
        "alt": "Портрет: Отец Николай"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 2
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 2
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 2
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 4
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 3
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 3
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 2
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 3
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 3
        }
      ],
      "abilities": [
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "expression",
          "name": "Экспрессия",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "leadership",
          "name": "Лидерство",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "etiquette",
          "name": "Этикет",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "melee",
          "name": "Ближний бой",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "academics",
          "name": "Академические знания",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "finance",
          "name": "Финансы",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "law",
          "name": "Закон",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "medicine",
          "name": "Медицина",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "occult",
          "name": "Оккультизм",
          "value": 4,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "linguistics",
          "name": "Лингвистика",
          "value": 2,
          "group": "Знания"
        }
      ],
      "disciplines": [
        {
          "name": "Власть над Тенью",
          "value": 3
        },
        {
          "name": "Доминирование",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 4
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 3
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 7,
      "bloodPool": 5,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Не стать монстром: потерять не более 1 человечности за пять ночей.",
          "game": "Сжечь икону на общем собрании."
        },
        "traitor": "Другой игрок должен умереть по твоей вине."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-06",
      "name": "Павел Игоревич Веденин",
      "clan": "Каитифы",
      "affiliation": "Независимый",
      "generation": "13",
      "nature": "Бунтарь",
      "demeanor": "Брюзга",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 5,
        "alt": "Портрет: Павел Игоревич Веденин"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 3
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 2
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 3
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 1
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 3
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 2
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 3
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 3
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 4
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "athletics",
          "name": "Атлетика",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "brawl",
          "name": "Драка",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "expression",
          "name": "Экспрессия",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 2,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "melee",
          "name": "Ближний бой",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "academics",
          "name": "Академические знания",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 3,
          "group": "Знания"
        },
        {
          "key": "law",
          "name": "Закон",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "occult",
          "name": "Оккультизм",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 3,
          "group": "Знания"
        },
        {
          "key": "dodge",
          "name": "Уклонение",
          "value": 1,
          "group": "Таланты"
        }
      ],
      "disciplines": [
        {
          "name": "Ясновидение",
          "value": 2
        },
        {
          "name": "Стремительность",
          "value": 1
        },
        {
          "name": "Сокрытие",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 3
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 4
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 8,
      "bloodPool": 8,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Успешно саботировать игру.",
          "game": "В конце должно остаться не более одного камарильца."
        },
        "traitor": "Член высшего клана должен быть уничтожен вне голосования (Вентру, Бруха, Ласомбра, Тореодор)."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-07",
      "name": "Сенька Голубев",
      "clan": "Носферату (Крысы)",
      "affiliation": "Камарилья",
      "generation": "12",
      "nature": "Трикстер",
      "demeanor": "Одиночка",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 6,
        "alt": "Портрет: Сенька Голубев"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 2
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 3
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 3
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 2
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 3
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 0
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 4
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 2
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 4
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "athletics",
          "name": "Атлетика",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "expression",
          "name": "Экспрессия",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "animalken",
          "name": "Знание животных",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "firearms",
          "name": "Огнестрельное оружие",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 4,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "finance",
          "name": "Финансы",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "dodge",
          "name": "Уклонение",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "security",
          "name": "Безопасность",
          "value": 3,
          "group": "Навыки"
        }
      ],
      "disciplines": [
        {
          "name": "Сокрытие",
          "value": 3
        },
        {
          "name": "Анимализм",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 3
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 4
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 7,
      "bloodPool": 9,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Выжить или сбежать из игры.",
          "game": "Украсть золотой крест графа Анатолия Дмитриевича Селиванова."
        },
        "traitor": "Опустить Маскарад до 2 или ниже."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-08",
      "name": "Софья Павловна Розанова",
      "clan": "Тореадор",
      "affiliation": "Камарилья",
      "generation": "10",
      "nature": "Фанатик",
      "demeanor": "Бон Вивант",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 7,
        "alt": "Портрет: Софья Павловна Розанова"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 1
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 3
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 2
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 4
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 3
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 4
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 3
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 2
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 3
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "athletics",
          "name": "Атлетика",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "expression",
          "name": "Экспрессия",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "leadership",
          "name": "Лидерство",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "etiquette",
          "name": "Этикет",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "firearms",
          "name": "Огнестрельное оружие",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "performance",
          "name": "Исполнение",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 2,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "academics",
          "name": "Академические знания",
          "value": 2,
          "group": "Знания"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "politics",
          "name": "Политика",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "linguistics",
          "name": "Лингвистика",
          "value": 1,
          "group": "Знания"
        }
      ],
      "disciplines": [
        {
          "name": "Величие",
          "value": 2
        },
        {
          "name": "Прорицание",
          "value": 1
        }
      ],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 4
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 3
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 6,
      "bloodPool": 6,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Превратить эту игру в собственное шоу. Повеселиться.",
          "game": "Получить стоячие овации на концерте в четвёртую ночь."
        },
        "traitor": "Подговорить одного игрока убить другого."
      },
      "layers": [],
      "draft": false
    },
    {
      "id": "character-09",
      "name": "Константин Белозёров",
      "clan": "Смертный",
      "affiliation": "Агент охотников",
      "generation": "",
      "nature": "Солдат",
      "demeanor": "Профессионал",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 8,
        "alt": "Портрет: Константин Белозёров"
      },
      "attributes": [
        {
          "key": "strength",
          "name": "Сила",
          "value": 2
        },
        {
          "key": "dexterity",
          "name": "Ловкость",
          "value": 4
        },
        {
          "key": "stamina",
          "name": "Выносливость",
          "value": 4
        },
        {
          "key": "charisma",
          "name": "Обаяние",
          "value": 2
        },
        {
          "key": "manipulation",
          "name": "Манипулирование",
          "value": 2
        },
        {
          "key": "appearance",
          "name": "Внешность",
          "value": 2
        },
        {
          "key": "perception",
          "name": "Восприятие",
          "value": 4
        },
        {
          "key": "intelligence",
          "name": "Интеллект",
          "value": 3
        },
        {
          "key": "wits",
          "name": "Сообразительность",
          "value": 3
        }
      ],
      "abilities": [
        {
          "key": "alertness",
          "name": "Внимательность",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "athletics",
          "name": "Атлетика",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "empathy",
          "name": "Эмпатия",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "intimidation",
          "name": "Запугивание",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "subterfuge",
          "name": "Хитрость",
          "value": 1,
          "group": "Таланты"
        },
        {
          "key": "etiquette",
          "name": "Этикет",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "firearms",
          "name": "Огнестрельное оружие",
          "value": 4,
          "group": "Навыки"
        },
        {
          "key": "melee",
          "name": "Ближний бой",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "stealth",
          "name": "Скрытность",
          "value": 3,
          "group": "Навыки"
        },
        {
          "key": "survival",
          "name": "Выживание",
          "value": 1,
          "group": "Навыки"
        },
        {
          "key": "investigation",
          "name": "Расследование",
          "value": 4,
          "group": "Знания"
        },
        {
          "key": "law",
          "name": "Закон",
          "value": 1,
          "group": "Знания"
        },
        {
          "key": "dodge",
          "name": "Уклонение",
          "value": 3,
          "group": "Таланты"
        },
        {
          "key": "security",
          "name": "Безопасность",
          "value": 2,
          "group": "Навыки"
        }
      ],
      "disciplines": [],
      "virtues": [
        {
          "key": "conscience",
          "name": "Совесть",
          "value": 4
        },
        {
          "key": "self_control",
          "name": "Самоконтроль",
          "value": 3
        },
        {
          "key": "courage",
          "name": "Мужество",
          "value": 3
        }
      ],
      "humanity": 7,
      "willpower": 9,
      "bloodPool": 0,
      "curse": "",
      "goals": {
        "main": {
          "personal": "Сбежать из игры вместе с охотниками и добиться уничтожения организаторов.",
          "game": "Никто не должен понять, что ты человек."
        },
        "traitor": "Просто доживи до конца."
      },
      "layers": [],
      "draft": false
    }
  ],
  "rooms": [
    {
      "id": "room-01",
      "name": "Большая гостиная",
      "summary": "Рояль под чехлом. Часы, которые спешат на семь минут.",
      "image": null,
      "draft": true,
      "initialLevel": 1,
      "layers": [
        {
          "title": "Осмотр",
          "text": "Здесь собираются к вечернему чаю. На камине стоят девять фотографий; одна повёрнута к стене."
        },
        {
          "title": "Скрытые сведения",
          "text": "Под крышкой рояля спрятана записка: «Не уезжайте до утра»."
        }
      ]
    },
    {
      "id": "room-02",
      "name": "Библиотека",
      "summary": "Тяжёлые портьеры, запах табака и ненаписанные письма.",
      "image": null,
      "draft": true,
      "initialLevel": 1,
      "layers": [
        {
          "title": "Осмотр",
          "text": "Книги доходят до самого потолка. На столе хозяина лежат разрезанный конверт и остановившиеся часы."
        },
        {
          "title": "Скрытые сведения",
          "text": "На последней странице расходной книги отмечен перевод, о котором никто не говорил."
        }
      ]
    },
    {
      "id": "room-03",
      "name": "Зимний сад",
      "summary": "За матовым стеклом ещё держится тепло.",
      "image": null,
      "draft": true,
      "initialLevel": 0,
      "layers": [
        {
          "title": "Осмотр",
          "text": "Сад давно не отапливается как прежде. Между кадками остались следы мокрой обуви."
        },
        {
          "title": "Скрытые сведения",
          "text": "Здесь назначена встреча. В щели между плитками лежит свежая папироса."
        }
      ]
    },
    {
      "id": "room-04",
      "name": "Старый флигель",
      "summary": "Дверь заперта с прошлого лета.",
      "image": null,
      "draft": true,
      "initialLevel": 0,
      "layers": [
        {
          "title": "Осмотр",
          "text": "Во флигеле хранят старую мебель. Одно окно недавно открывали изнутри."
        },
        {
          "title": "Скрытые сведения",
          "text": "За шкафом есть дверь в небольшую комнату. На столе — расходная книга управляющего."
        }
      ]
    }
  ],
  "npcs": [
    {
      "id": "stationmaster",
      "name": "Степан Климов",
      "role": "Станционный смотритель",
      "summary": "Привёз телеграмму и просит поговорить с хозяином без свидетелей.",
      "portrait": {
        "src": "assets/portraits.png",
        "cell": 6,
        "alt": "Временный портрет станционного смотрителя"
      },
      "layers": [],
      "draft": true
    }
  ],
  "masqueradeEvents": [
    {
      "label": "Странное поведение перед гостями",
      "change": 0,
      "note": "Повторяющиеся случаи могут снизить показатель."
    },
    {
      "label": "Свидетель сверхъестественного",
      "change": -1
    },
    {
      "label": "Исчезновение гостя",
      "change": -1
    },
    {
      "label": "Открытая демонстрация дисциплины",
      "change": -1
    },
    {
      "label": "Серьёзный инцидент",
      "change": -2
    }
  ],
  "cleanNight": {
    "title": "Чистая ночь",
    "night": "Ночь четвёртая",
    "text": "На эту ночь нельзя применять активно используемые дисциплины. Пассивные эффекты сохраняются."
  },
  "gmGuide": [
    {
      "title": "Структура игры",
      "text": "Игра длится пять ночей. У каждого персонажа есть две основные цели: личная и игровая. У отдельных ролей есть третья, скрытая цель. Раскрывайте цели только владельцам персонажей и отдельно управляйте основной парой и целью предателя. Персонаж, не выполнивший личную цель, погибает; для скрытых ролей действуют их особые условия."
    },
    {
      "title": "Внешняя угроза",
      "text": "Со второй ночи рядом с гостями появляются охотники. Они понимают, что среди присутствующих есть сверхъестественные существа, но не знают их личностей. Используйте их присутствие как растущее давление на секретность персонажей."
    },
    {
      "title": "Маскарад",
      "text": "Шкала Маскарада имеет значения от 0 до 5 и начинает игру с 5. Снижение отмечает внимание, привлечённое сверхъестественными событиями. На второй ночи шкала открывается игрокам; ведущий может открыть её раньше или позже."
    }
  ],
  "notice": "Локальная рабочая версия. Управление ролями и раскрытиями служит для проверки интерфейса; для совместной игры требуется серверный вход и защита личных материалов."
};
