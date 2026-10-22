import React, { useEffect } from 'react';
import './Legal.css';

export const TERMS_HASH = '#terms';
export const PRIVACY_HASH = '#privacy';
const UPDATED = '22 octobre 2026';
const CONTACT = 'ytspana@gmail.com';
const Mail = () => <a href={`mailto:${CONTACT}`}>{CONTACT}</a>;

const TERMS = {
  title: 'Conditions d’utilisation',
  intro: 'Bully’s Lair est un site de jeux gratuit et non commercial, fait entre amis. En créant un compte ou en utilisant le site, tu acceptes les règles ci-dessous.',
  sections: [
    ['Le service', [
      'Le site propose des quiz multijoueurs et des jeux jouables dans le navigateur. Il est gratuit, sans publicité et sans achat.',
      'Il est fourni « tel quel » : il peut changer, être interrompu ou fermer à tout moment, et des données de jeu peuvent être perdues.'
    ]],
    ['Ton compte', [
      'Un compte est nécessaire pour jouer. Tu le crées avec un pseudo et un mot de passe (sans adresse e-mail), ou avec Discord.',
      'Tu es responsable de ton mot de passe. Comme le site ne connaît pas ton e-mail, en cas d’oubli c’est l’administrateur qui te donne un code de réinitialisation, après avoir vérifié que le compte est bien le tien.',
      'Si tu passes par Discord, tu dois respecter ses conditions d’utilisation, y compris l’âge minimum qu’elles imposent.',
      'Tu peux supprimer ton compte à tout moment depuis le menu de ton compte sur le site.'
    ]],
    ['Bonne conduite', [
      'Pas de pseudo, de réponse ou de contenu insultant, haineux, illégal ou à caractère sexuel.',
      'Pas de triche ni de manipulation des scores, des classements ou du serveur, pas d’attaque ou de surcharge volontaire du site.',
      'Les organisateurs de quiz sont responsables des questions, images et liens qu’ils ajoutent.',
      'Un pseudo, un score ou un compte qui ne respecte pas ces règles peut être retiré sans préavis.'
    ]],
    ['Propriété intellectuelle', [
      'Bully’s Lair est un projet de fans sans but lucratif. Pokémon, Sonic et les autres noms, personnages et images cités appartiennent à leurs détenteurs respectifs (Nintendo, Game Freak, The Pokémon Company, SEGA…) ; le site n’est ni affilié ni approuvé par eux.',
      'Les sprites animés viennent du projet PMDCollab SpriteCollab (licence CC BY-NC 4.0) ; les crédits sont indiqués dans les jeux concernés.',
      <>Si tu es titulaire de droits et qu’un contenu te pose problème, écris à <Mail /> : il sera retiré.</>
    ]],
    ['Responsabilité', [
      'Le site est un loisir : dans les limites permises par la loi, l’éditeur ne peut être tenu responsable d’une interruption, d’une perte de progression ou d’un contenu ajouté par un utilisateur.'
    ]],
    ['Modifications', [
      'Ces conditions peuvent évoluer ; la date de mise à jour en haut de la page change alors. Continuer à utiliser le site vaut acceptation de la nouvelle version.'
    ]]
  ]
};

const PRIVACY = {
  title: 'Politique de confidentialité',
  intro: 'Le site collecte le minimum nécessaire pour faire tourner les jeux. Rien n’est vendu, rien ne sert à de la publicité, et il n’y a pas d’outil de mesure d’audience.',
  sections: [
    ['Ton compte', [
      'Compte classique : ton pseudo et ton mot de passe. Le mot de passe n’est jamais stocké en clair, seulement une empreinte chiffrée (scrypt). Aucune adresse e-mail n’est demandée.',
      'Compte Discord : le site reçoit seulement ce que l’autorisation « identify » permet, c’est-à-dire ton identifiant, ton nom d’utilisateur, ton nom affiché et ton avatar. Pas ton e-mail, pas tes serveurs, pas tes messages.',
      'Le site enregistre aussi la date de création et de dernière connexion, ta progression dans les jeux et le résumé de tes parties (date, Pokémon joué, durée, nombre de K.O., niveau, score, résultat).',
      'Les classements sont publics : ils affichent ton pseudo (ou ton nom Discord), ton avatar Discord si tu en as un et tes meilleurs scores.'
    ]],
    ['Pendant les parties', [
      'Tes réponses aux quiz servent uniquement pendant la partie : le serveur les garde en mémoire le temps de la partie.',
      'Certains réglages (volume de la musique) et une copie de ta progression sont enregistrés dans le stockage local de ton navigateur.'
    ]],
    ['Cookies', [
      'Un cookie de session (« bl_session ») te garde connecté pendant 30 jours au plus ; il est invalidé si ton mot de passe est réinitialisé.',
      'Un cookie temporaire (« bl_oauth », 10 minutes) protège la connexion avec Discord.',
      'Ce sont des cookies strictement nécessaires au fonctionnement du compte : aucun cookie publicitaire ou de suivi.'
    ]],
    ['Où sont les données', [
      'Le site est hébergé par Railway et les données de compte sont stockées dans une base MongoDB.',
      'Certaines pages chargent des contenus de services tiers qui peuvent voir ton adresse IP : vidéos et musiques YouTube dans les quiz, polices Google Fonts, images hébergées sur GitHub ou d’autres sites, et avatars Discord.'
    ]],
    ['Durée de conservation', [
      'Les données de ton compte sont gardées tant que ton compte existe. Si tu le supprimes, ton compte, ta sauvegarde en ligne et l’historique de tes parties sont effacés immédiatement, et tu disparais des classements.'
    ]],
    ['Tes droits', [
      'Tu peux supprimer ton compte et toutes ses données depuis le menu de ton compte sur le site (bouton « Supprimer mon compte »).',
      'Si tu utilises Discord, tu peux aussi retirer l’accès du site dans Discord : Paramètres utilisateur → Applications autorisées.',
      <>Pour toute autre demande (accès, rectification, question), écris à <Mail />.</>
    ]]
  ]
};

const LegalPage = ({ doc = 'terms', onClose, onOther }) => {
  const d = doc === 'privacy' ? PRIVACY : TERMS;
  useEffect(() => {
    document.title = `${d.title} · Bully’s Lair`;
    return () => { document.title = 'Bully’s Lair'; };
  }, [d.title]);
  return (
    <div className="lg-root">
      <article className="lg-page">
        <div className="lg-top">
          <span className="lg-kicker">Bully’s Lair</span>
          <button type="button" className="lg-back" onClick={onClose}>Retour au site</button>
        </div>
        <h1>{d.title}</h1>
        <p className="lg-date">Dernière mise à jour : {UPDATED}</p>
        <p className="lg-intro">{d.intro}</p>
        {d.sections.map(([title, items], i) => (
          <section key={title}>
            <h2><span>{i + 1}.</span> {title}</h2>
            <ul>{items.map((t, k) => <li key={k}>{t}</li>)}</ul>
          </section>
        ))}
        <footer className="lg-foot">
          <p className="lg-contact">Contact : <Mail /></p>
          <button type="button" className="lg-link" onClick={onOther}>
            {doc === 'privacy' ? 'Lire les conditions d’utilisation' : 'Lire la politique de confidentialité'}
          </button>
        </footer>
      </article>
    </div>
  );
};

export default LegalPage;
