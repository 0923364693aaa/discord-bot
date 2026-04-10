const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const { token } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 📌 77 จังหวัด
const regions = {
  "เหนือ": [
    "เชียงใหม่","เชียงราย","ลำปาง","ลำพูน","แม่ฮ่องสอน",
    "น่าน","พะเยา","แพร่","อุตรดิตถ์"
  ],
  "อีสาน": [
    "ขอนแก่น","นครราชสีมา","อุบลราชธานี","อุดรธานี","บุรีรัมย์",
    "สุรินทร์","ศรีสะเกษ","ร้อยเอ็ด","ยโสธร","ชัยภูมิ",
    "กาฬสินธุ์","มหาสารคาม","สกลนคร","นครพนม","มุกดาหาร",
    "หนองคาย","หนองบัวลำภู","เลย","อำนาจเจริญ","บึงกาฬ"
  ],
  "กลาง": [
    "กรุงเทพมหานคร","นนทบุรี","ปทุมธานี","สมุทรปราการ",
    "พระนครศรีอยุธยา","อ่างทอง","ลพบุรี","สิงห์บุรี",
    "ชัยนาท","สระบุรี","นครนายก"
  ],
  "ตะวันออก": [
    "ชลบุรี","ระยอง","จันทบุรี","ตราด",
    "ฉะเชิงเทรา","ปราจีนบุรี","สระแก้ว"
  ],
  "ตะวันตก": [
    "กาญจนบุรี","ราชบุรี","เพชรบุรี",
    "ประจวบคีรีขันธ์","ตาก"
  ],
  "ใต้": [
    "กระบี่","ชุมพร","ตรัง","นครศรีธรรมราช","นราธิวาส",
    "ปัตตานี","พังงา","พัทลุง","ภูเก็ต","ยะลา",
    "ระนอง","สงขลา","สตูล","สุราษฎร์ธานี"
  ]
};

// 🔽 เมนูเลือกภาค
function regionMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('region')
      .setPlaceholder('🌏 โปรดเลือกภาค')
      .addOptions(
        Object.keys(regions).map(r => ({
          label: r,
          value: r
        }))
      )
  );
}

// 🔽 เมนูเลือกจังหวัด
function provinceMenu(region) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('province')
      .setPlaceholder('📍 เลือกจังหวัด')
      .addOptions(
        regions[region].map(p => ({
          label: p,
          value: p
        }))
      )
  );
}

// 🔘 ปุ่มรีเซ็ต
function resetBtn() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('reset')
      .setLabel('⭐ รีเซ็ตจังหวัด')
      .setStyle(ButtonStyle.Danger)
  );
}

// 🚀 บอทพร้อม
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 🎮 Interaction
client.on('interactionCreate', async interaction => {

  // ===== /start =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'start') {

      const embed = new EmbedBuilder()
        .setTitle('📢 รับยศตามภูมิภาคและจังหวัด')
        .setDescription('**77 จังหวัด เลือกภาค**\nเลือกภาค | เลือกจังหวัด')
        .setImage('https://i.imgur.com/abc123.png')
        .setColor(0x2b2dff)
        .setFooter({ text: 'ระบบเลือกยศอัตโนมัติ' });

      // 🔥 ซ่อนคำสั่ง
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();

      // 🔥 ส่ง Embed ลงห้อง
      await interaction.channel.send({
        embeds: [embed],
        components: [regionMenu(), resetBtn()]
      });
    }
  }

  // ===== เลือกภาค =====
  if (interaction.isStringSelectMenu() && interaction.customId === 'region') {
    const region = interaction.values[0];

    await interaction.update({
      content: `📌 คุณเลือกภาค: ${region}`,
      components: [provinceMenu(region), resetBtn()]
    });

    await interaction.followUp({
      content: `📍 กรุณาเลือกจังหวัดของคุณใน ${region}`,
      ephemeral: true
    });
  }

  // ===== เลือกจังหวัด =====
  if (interaction.isStringSelectMenu() && interaction.customId === 'province') {

    const province = interaction.values[0];
    const member = await interaction.guild.members.fetch(interaction.user.id);

    let role = interaction.guild.roles.cache.find(r => r.name === province);

    if (!role) {
      return interaction.reply({
        content: `❌ ไม่เจอ Role: ${province}`,
        ephemeral: true
      });
    }

    try {
      Object.values(regions).flat().forEach(async (prov) => {
        const oldRole = interaction.guild.roles.cache.find(r => r.name === prov);
        if (oldRole && member.roles.cache.has(oldRole.id)) {
          await member.roles.remove(oldRole);
        }
      });

      await member.roles.add(role);

    } catch (err) {
      return interaction.reply({
        content: "❌ บอทไม่มีสิทธิ์ (เช็ค Role Position)",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `✅ คุณได้รับยศ ${province} เรียบร้อยแล้ว!`,
      ephemeral: true
    });

    await interaction.message.edit({
      embeds: interaction.message.embeds,
      components: [regionMenu(), resetBtn()]
    });
  }

  // ===== รีเซ็ต =====
  if (interaction.isButton() && interaction.customId === 'reset') {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    Object.values(regions).flat().forEach(async (prov) => {
      const role = interaction.guild.roles.cache.find(r => r.name === prov);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
      }
    });

    await interaction.update({
      content: '🔄 รีเซ็ตแล้ว',
      components: [regionMenu()]
    });
  }

});

client.login(token);
